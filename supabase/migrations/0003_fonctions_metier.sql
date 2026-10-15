-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0003 : Fonctions RPC metier (transactions)
-- Toutes les operations sensibles passent par ces fonctions SECURITY DEFINER.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transitions de statut autorisees
-- -----------------------------------------------------------------------------
create or replace function transitions_autorisees(p_statut statut_commande)
returns statut_commande[]
language sql
immutable
as $$
  select case p_statut
    when 'EN_ATTENTE_CONFIRMATION' then array['CONFIRMEE', 'ANNULEE']::statut_commande[]
    when 'CONFIRMEE' then array['EN_PREPARATION', 'ANNULEE']::statut_commande[]
    when 'EN_PREPARATION' then array['EXPEDIEE', 'ANNULEE']::statut_commande[]
    when 'EXPEDIEE' then array['LIVREE', 'RETOURNEE']::statut_commande[]
    when 'LIVREE' then array['RETOURNEE']::statut_commande[]
    else array[]::statut_commande[]
  end;
$$;

create or replace function transition_valide(p_depuis statut_commande, p_vers statut_commande)
returns boolean
language sql
immutable
as $$
  select p_vers = any (transitions_autorisees(p_depuis));
$$;

-- -----------------------------------------------------------------------------
-- Validation d'une promotion (appelable publiquement, securisee)
-- -----------------------------------------------------------------------------
create or replace function valider_promotion(
  p_code text,
  p_sous_total numeric,
  p_lignes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  promo promotions%rowtype;
  montant numeric := 0;
  base numeric := p_sous_total;
  ligne jsonb;
  produit_id uuid;
  categorie_id uuid;
  correspond boolean;
  total_correspondant numeric := 0;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Aucun code fourni.');
  end if;

  select * into promo from promotions
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Code promotionnel inconnu.');
  end if;

  if not promo.est_active then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code promotionnel n''est plus actif.');
  end if;

  if now() < promo.date_debut then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code n''est pas encore valide.');
  end if;

  if promo.date_fin is not null and now() > promo.date_fin then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code promotionnel a expiré.');
  end if;

  if promo.limite_utilisation is not null and promo.nombre_utilisations >= promo.limite_utilisation then
    return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Ce code a atteint sa limite d''utilisation.');
  end if;

  -- Restrictions par produit ou categorie : on ne retient que les lignes eligibles.
  if array_length(promo.produits_ids, 1) is not null or array_length(promo.categories_ids, 1) is not null then
    for ligne in select * from jsonb_array_elements(coalesce(p_lignes, '[]'::jsonb))
    loop
      produit_id := nullif(ligne ->> 'produit_id', '')::uuid;
      select categorie_id into categorie_id from produits where id = produit_id;
      correspond := (produit_id = any (promo.produits_ids)) or (categorie_id = any (promo.categories_ids));
      if correspond then
        total_correspondant := total_correspondant + (coalesce((ligne ->> 'prix_unitaire')::numeric, 0) * coalesce((ligne ->> 'quantite')::int, 0));
      end if;
    end loop;
    base := total_correspondant;
    if base <= 0 then
      return jsonb_build_object('valide', false, 'montant_reduction', 0, 'message', 'Aucun article de ce panier n''est éligible à ce code.');
    end if;
  end if;

  if p_sous_total < promo.montant_minimum then
    return jsonb_build_object(
      'valide', false,
      'montant_reduction', 0,
      'message', 'Ce code est valable pour un minimum de ' || to_char(promo.montant_minimum, 'FM999999990D00') || ' MAD d''achat.'
    );
  end if;

  if promo.type_reduction = 'POURCENTAGE' then
    montant := round((base * promo.valeur / 100)::numeric, 2);
  else
    montant := least(promo.valeur, base);
  end if;

  return jsonb_build_object(
    'valide', true,
    'montant_reduction', montant,
    'promotion_id', promo.id,
    'code', promo.code,
    'libelle', promo.nom,
    'message', 'Code appliqué.'
  );
end;
$$;

grant execute on function valider_promotion(text, numeric, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Creation d'une commande (guest). Idempotente et transactionnelle.
-- Le stock est reserve de maniere atomique avec verrouillage des lignes.
-- -----------------------------------------------------------------------------
create or replace function creer_commande(
  p_payload jsonb,
  p_cle_idempotence text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_variable
declare
  commande_existante commandes%rowtype;
  nouvelle_commande commandes%rowtype;
  article jsonb;
  produit produits%rowtype;
  variante variantes_produit%rowtype;
  a_variante boolean;
  quantite_demandee integer;
  prix_base numeric;
  prix_promo numeric;
  prix_unitaire numeric;
  v_sous_total numeric := 0;
  reduction numeric := 0;
  frais numeric := 0;
  seuil_gratuit numeric := 0;
  total numeric := 0;
  jeton text;
  empreinte text;
  resultat_promotion jsonb;
  lignes_json jsonb := '[]'::jsonb;
  lignes_pour_promo jsonb := '[]'::jsonb;
  params jsonb;
  reservation_heures integer := 48;
  numero text;
begin
  -- Idempotence : renvoyer la commande deja creee pour une meme cle.
  select * into commande_existante from commandes where cle_idempotence = p_cle_idempotence limit 1;
  if found then
    select empreinte_jeton into empreinte from jetons_suivi_commande
    where commande_id = commande_existante.id and est_revoque = false
    order by date_creation desc limit 1;
    return jsonb_build_object(
      'id', commande_existante.id,
      'numero_commande', commande_existante.numero_commande,
      'statut_commande', commande_existante.statut_commande,
      'montant_total', commande_existante.montant_total,
      'sous_total', commande_existante.sous_total,
      'montant_reduction', commande_existante.montant_reduction,
      'frais_livraison', commande_existante.frais_livraison,
      'devise', commande_existante.devise,
      'date_creation', commande_existante.date_creation,
      'deja_existante', true,
      'jeton_suivi', null
    );
  end if;

  if p_payload -> 'articles' is null or jsonb_array_length(p_payload -> 'articles') = 0 then
    raise exception 'Le panier est vide.' using errcode = '22000';
  end if;

  -- Parametres boutique (frais de livraison, seuil, duree de reservation).
  select valeur into params from parametres_boutique where cle = 'livraison';
  if found then
    frais := coalesce((params ->> 'frais_livraison')::numeric, 30);
    seuil_gratuit := coalesce((params ->> 'seuil_livraison_gratuite')::numeric, 0);
  else
    frais := 30;
    seuil_gratuit := 500;
  end if;

  select valeur into params from parametres_boutique where cle = 'stock';
  if found then
    reservation_heures := coalesce((params ->> 'reservation_heures')::int, 48);
  end if;

  numero := generer_numero_commande();

  -- Insertion de l'entete (le total definitif est calcule plus bas).
  insert into commandes (
    numero_commande, nom_client, telephone_client, email_client,
    ville_livraison, adresse_livraison, complement_adresse, instructions_livraison,
    cle_idempotence, code_promotion, reservation_expire_le
  ) values (
    numero,
    trim(p_payload ->> 'nom_client'),
    trim(p_payload ->> 'telephone_client'),
    nullif(trim(coalesce(p_payload ->> 'email_client', '')), ''),
    trim(p_payload ->> 'ville_livraison'),
    trim(p_payload ->> 'adresse_livraison'),
    nullif(trim(coalesce(p_payload ->> 'complement_adresse', '')), ''),
    nullif(trim(coalesce(p_payload ->> 'instructions_livraison', '')), ''),
    p_cle_idempotence,
    nullif(upper(trim(coalesce(p_payload ->> 'code_promotion', ''))), ''),
    now() + make_interval(hours => reservation_heures)
  ) returning * into nouvelle_commande;

  -- Parcours des articles : verrouillage, verification, reservation du stock.
  for article in select * from jsonb_array_elements(p_payload -> 'articles')
  loop
    quantite_demandee := coalesce((article ->> 'quantite')::int, 0);
    if quantite_demandee <= 0 or quantite_demandee > 50 then
      raise exception 'Quantité invalide.' using errcode = '22000';
    end if;

    a_variante := nullif(article ->> 'variante_id', '') is not null;

    select * into produit from produits
    where id = (article ->> 'produit_id')::uuid
    for update;

    if not found then
      raise exception 'Produit introuvable.' using errcode = 'P0002';
    end if;
    if produit.est_publie = false then
      raise exception 'Le produit % n''est plus disponible.', produit.nom using errcode = '22000';
    end if;

    if a_variante then
      select * into variante from variantes_produit
      where id = (article ->> 'variante_id')::uuid and produit_id = produit.id
      for update;

      if not found then
        raise exception 'Variante introuvable.' using errcode = 'P0002';
      end if;
      if variante.est_active = false then
        raise exception 'La variante % n''est plus disponible.', variante.nom using errcode = '22000';
      end if;
      if variante.quantite_stock < quantite_demandee then
        raise exception 'Stock insuffisant pour %. Disponible : %.', produit.nom || ' - ' || variante.nom, variante.quantite_stock using errcode = '22000';
      end if;

      update variantes_produit
        set quantite_stock = quantite_stock - quantite_demandee
        where id = variante.id;

      insert into mouvements_stock (produit_id, variante_id, type_mouvement, quantite, motif, commande_id)
      values (produit.id, variante.id, 'RESERVATION', -quantite_demandee, 'Réservation à la création de commande', nouvelle_commande.id);

      prix_base := coalesce(variante.prix_vente, produit.prix_vente);
      prix_promo := coalesce(variante.prix_promotionnel, produit.prix_promotionnel);
      if prix_promo is not null and prix_promo >= prix_base then
        prix_promo := null;
      end if;
      prix_unitaire := coalesce(prix_promo, prix_base);

      lignes_json := lignes_json || jsonb_build_object(
        'produit_id', produit.id,
        'variante_id', variante.id,
        'nom_produit', produit.nom,
        'nom_variante', variante.nom,
        'reference_sku', coalesce(variante.reference_sku, produit.reference_sku),
        'prix_unitaire', prix_unitaire,
        'quantite', quantite_demandee
      );
    else
      if produit.quantite_stock < quantite_demandee then
        raise exception 'Stock insuffisant pour %. Disponible : %.', produit.nom, produit.quantite_stock using errcode = '22000';
      end if;

      update produits
        set quantite_stock = quantite_stock - quantite_demandee
        where id = produit.id;

      insert into mouvements_stock (produit_id, type_mouvement, quantite, motif, commande_id)
      values (produit.id, 'RESERVATION', -quantite_demandee, 'Réservation à la création de commande', nouvelle_commande.id);

      prix_unitaire := coalesce(produit.prix_promotionnel, produit.prix_vente);

      lignes_json := lignes_json || jsonb_build_object(
        'produit_id', produit.id,
        'variante_id', null,
        'nom_produit', produit.nom,
        'nom_variante', null,
        'reference_sku', produit.reference_sku,
        'prix_unitaire', prix_unitaire,
        'quantite', quantite_demandee
      );
    end if;

    v_sous_total := v_sous_total + (prix_unitaire * quantite_demandee);
    lignes_pour_promo := lignes_pour_promo || jsonb_build_object(
      'produit_id', produit.id,
      'prix_unitaire', prix_unitaire,
      'quantite', quantite_demandee
    );
  end loop;

  -- Insertion des lignes de commande (instantane).
  for article in select * from jsonb_array_elements(lignes_json)
  loop
    insert into lignes_commande (
      commande_id, produit_id, variante_id, nom_produit, nom_variante,
      reference_sku, prix_unitaire, quantite, montant_ligne
    ) values (
      nouvelle_commande.id,
      (article ->> 'produit_id')::uuid,
      nullif(article ->> 'variante_id', '')::uuid,
      article ->> 'nom_produit',
      nullif(article ->> 'nom_variante', ''),
      nullif(article ->> 'reference_sku', ''),
      (article ->> 'prix_unitaire')::numeric,
      (article ->> 'quantite')::int,
      (article ->> 'prix_unitaire')::numeric * (article ->> 'quantite')::int
    );
  end loop;

  -- Promotion appliquee cote serveur uniquement.
  if nouvelle_commande.code_promotion is not null then
    resultat_promotion := valider_promotion(nouvelle_commande.code_promotion, v_sous_total, lignes_pour_promo);
    if (resultat_promotion ->> 'valide')::boolean then
      reduction := (resultat_promotion ->> 'montant_reduction')::numeric;
      insert into utilisations_promotions (promotion_id, commande_id)
      values ((resultat_promotion ->> 'promotion_id')::uuid, nouvelle_commande.id);
      update promotions
        set nombre_utilisations = nombre_utilisations + 1
        where id = (resultat_promotion ->> 'promotion_id')::uuid;
    end if;
  end if;

  frais := case when seuil_gratuit > 0 and (v_sous_total - reduction) >= seuil_gratuit then 0 else frais end;
  total := v_sous_total - reduction + frais;
  if total < 0 then
    total := 0;
  end if;

  update commandes
    set sous_total = v_sous_total,
        montant_reduction = reduction,
        frais_livraison = frais,
        montant_total = total
    where id = nouvelle_commande.id
    returning * into nouvelle_commande;

  insert into historique_statuts_commande (commande_id, statut_precedent, statut_nouveau, commentaire, acteur)
  values (nouvelle_commande.id, null, 'EN_ATTENTE_CONFIRMATION', 'Commande créée par le client.', 'CLIENT');

  -- Jeton de suivi : seul le hachage est conserve.
  jeton := encode(gen_random_bytes(32), 'hex');
  empreinte := encode(digest(jeton, 'sha256'), 'hex');
  insert into jetons_suivi_commande (commande_id, empreinte_jeton, date_expiration)
  values (nouvelle_commande.id, empreinte, now() + interval '180 days');

  return jsonb_build_object(
    'id', nouvelle_commande.id,
    'numero_commande', nouvelle_commande.numero_commande,
    'statut_commande', nouvelle_commande.statut_commande,
    'sous_total', nouvelle_commande.sous_total,
    'montant_reduction', nouvelle_commande.montant_reduction,
    'frais_livraison', nouvelle_commande.frais_livraison,
    'montant_total', nouvelle_commande.montant_total,
    'devise', nouvelle_commande.devise,
    'date_creation', nouvelle_commande.date_creation,
    'deja_existante', false,
    'jeton_suivi', jeton
  );
end;
$$;

grant execute on function creer_commande(jsonb, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Suivi public d'une commande par jeton (informations limitees uniquement)
-- -----------------------------------------------------------------------------
create or replace function suivre_commande(p_jeton text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  empreinte text;
  commande commandes%rowtype;
  historique jsonb;
begin
  if p_jeton is null or length(p_jeton) < 32 then
    return jsonb_build_object('trouve', false, 'message', 'Jeton de suivi invalide.');
  end if;

  empreinte := encode(digest(p_jeton, 'sha256'), 'hex');

  select c.* into commande
  from jetons_suivi_commande j
  join commandes c on c.id = j.commande_id
  where j.empreinte_jeton = empreinte
    and j.est_revoque = false
    and j.date_expiration > now()
  limit 1;

  if not found then
    return jsonb_build_object('trouve', false, 'message', 'Aucune commande trouvée pour ce lien de suivi.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'statut', statut_nouveau,
    'date', date_creation
  ) order by date_creation), '[]'::jsonb) into historique
  from historique_statuts_commande
  where commande_id = commande.id;

  return jsonb_build_object(
    'trouve', true,
    'numero_commande', commande.numero_commande,
    'statut_commande', commande.statut_commande,
    'date_creation', commande.date_creation,
    'montant_total', commande.montant_total,
    'devise', commande.devise,
    'historique', historique
  );
end;
$$;

grant execute on function suivre_commande(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Suivi public d'une commande par numero + telephone (sans lien de suivi)
-- Utilise lorsque le client a perdu son lien / quitte le navigateur.
-- -----------------------------------------------------------------------------
create or replace function suivre_commande_par_contact(
  p_numero text,
  p_telephone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  commande commandes%rowtype;
  telephone_digits text;
  historique jsonb;
begin
  if p_numero is null or length(trim(p_numero)) < 6 then
    return jsonb_build_object('trouve', false, 'message', 'Numero de commande invalide.');
  end if;

  telephone_digits := regexp_replace(coalesce(p_telephone, ''), '[^0-9]', '', 'g');
  if length(telephone_digits) < 8 then
    return jsonb_build_object('trouve', false, 'message', 'Numero de telephone invalide.');
  end if;

  select * into commande
  from commandes
  where upper(trim(numero_commande)) = upper(trim(p_numero))
    and regexp_replace(telephone_client, '[^0-9]', '', 'g') = telephone_digits
  limit 1;

  if not found then
    return jsonb_build_object(
      'trouve', false,
      'message', 'Aucune commande ne correspond a ce numero et ce telephone.'
    );
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'statut', statut_nouveau,
    'date', date_creation
  ) order by date_creation), '[]'::jsonb) into historique
  from historique_statuts_commande
  where commande_id = commande.id;

  return jsonb_build_object(
    'trouve', true,
    'numero_commande', commande.numero_commande,
    'statut_commande', commande.statut_commande,
    'date_creation', commande.date_creation,
    'montant_total', commande.montant_total,
    'devise', commande.devise,
    'historique', historique
  );
end;
$$;

grant execute on function suivre_commande_par_contact(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Liberation du stock d'une commande (une seule fois)
-- -----------------------------------------------------------------------------
create or replace function liberer_stock_commande(
  p_commande_id uuid,
  p_motif text default 'Annulation de commande'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ligne lignes_commande%rowtype;
  commande commandes%rowtype;
begin
  select * into commande from commandes where id = p_commande_id for update;
  if not found then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;

  if commande.stock_libere then
    return jsonb_build_object('libere', false, 'message', 'Stock déjà libéré.');
  end if;

  for ligne in select * from lignes_commande where commande_id = p_commande_id
  loop
    if ligne.variante_id is not null then
      update variantes_produit
        set quantite_stock = quantite_stock + ligne.quantite
        where id = ligne.variante_id;
      insert into mouvements_stock (produit_id, variante_id, type_mouvement, quantite, motif, commande_id)
      values (ligne.produit_id, ligne.variante_id, 'LIBERATION', ligne.quantite, p_motif, p_commande_id);
    elsif ligne.produit_id is not null then
      update produits
        set quantite_stock = quantite_stock + ligne.quantite
        where id = ligne.produit_id;
      insert into mouvements_stock (produit_id, type_mouvement, quantite, motif, commande_id)
      values (ligne.produit_id, 'LIBERATION', ligne.quantite, p_motif, p_commande_id);
    end if;
  end loop;

  update commandes set stock_libere = true where id = p_commande_id;

  return jsonb_build_object('libere', true, 'message', 'Stock libéré.');
end;
$$;

revoke all on function liberer_stock_commande(uuid, text) from anon;
grant execute on function liberer_stock_commande(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Changement de statut d'une commande (respect des transitions)
-- -----------------------------------------------------------------------------
create or replace function changer_statut_commande(
  p_commande_id uuid,
  p_nouveau_statut statut_commande,
  p_commentaire text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  commande commandes%rowtype;
begin
  if not est_gestionnaire() then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  select * into commande from commandes where id = p_commande_id for update;
  if not found then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;

  if commande.statut_commande = p_nouveau_statut then
    return jsonb_build_object('succes', true, 'statut', p_nouveau_statut, 'message', 'Statut inchangé.');
  end if;

  if not transition_valide(commande.statut_commande, p_nouveau_statut) then
    raise exception 'Transition de statut non autorisée : % vers %.', commande.statut_commande, p_nouveau_statut using errcode = '22000';
  end if;

  update commandes set statut_commande = p_nouveau_statut where id = p_commande_id;

  if p_nouveau_statut = 'ANNULEE' then
    perform liberer_stock_commande(p_commande_id, 'Libération suite à annulation');
  end if;

  if p_nouveau_statut = 'RETOURNEE' then
    perform liberer_stock_commande(p_commande_id, 'Réintégration suite à retour');
  end if;

  insert into historique_statuts_commande (commande_id, statut_precedent, statut_nouveau, commentaire, acteur)
  values (p_commande_id, commande.statut_commande, p_nouveau_statut, p_commentaire, auth.uid()::text);

  return jsonb_build_object(
    'succes', true,
    'statut', p_nouveau_statut,
    'ancien_statut', commande.statut_commande,
    'message', 'Statut mis à jour.'
  );
end;
$$;

revoke all on function changer_statut_commande(uuid, statut_commande, text) from anon;
grant execute on function changer_statut_commande(uuid, statut_commande, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Confirmation explicite d'une commande
-- -----------------------------------------------------------------------------
create or replace function confirmer_commande(
  p_commande_id uuid,
  p_commentaire text default 'Commande confirmée par l''administration'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return changer_statut_commande(p_commande_id, 'CONFIRMEE', p_commentaire);
end;
$$;

revoke all on function confirmer_commande(uuid, text) from anon;
grant execute on function confirmer_commande(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Statistiques du tableau de bord (donnees reelles, aucun chiffre invente)
-- -----------------------------------------------------------------------------
create or replace function statistiques_tableau_de_bord()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  resultat jsonb;
  en_attente integer;
  confirmees integer;
  preparation integer;
  expediees integer;
  livrees integer;
  annulees integer;
  montant_attente numeric;
  ca_confirme numeric;
  ventes_jour jsonb;
  top_produits jsonb;
  stock_faible jsonb;
  commandes_recentes jsonb;
begin
  if not est_personnel() then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  select count(*) into en_attente from commandes where statut_commande = 'EN_ATTENTE_CONFIRMATION';
  select count(*) into confirmees from commandes where statut_commande = 'CONFIRMEE';
  select count(*) into preparation from commandes where statut_commande = 'EN_PREPARATION';
  select count(*) into expediees from commandes where statut_commande = 'EXPEDIEE';
  select count(*) into livrees from commandes where statut_commande = 'LIVREE';
  select count(*) into annulees from commandes where statut_commande = 'ANNULEE';

  select coalesce(sum(montant_total), 0) into montant_attente
  from commandes where statut_commande = 'EN_ATTENTE_CONFIRMATION';

  select coalesce(sum(montant_total), 0) into ca_confirme
  from commandes where statut_commande in ('CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE');

  select coalesce(jsonb_agg(jsonb_build_object('jour', jour, 'total', total) order by jour), '[]'::jsonb)
  into ventes_jour
  from (
    select to_char(date_creation::date, 'YYYY-MM-DD') as jour, sum(montant_total) as total
    from commandes
    where date_creation >= now() - interval '30 days'
      and statut_commande not in ('ANNULEE', 'RETOURNEE')
    group by date_creation::date
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('nom', nom_produit, 'quantite', quantite) order by quantite desc), '[]'::jsonb)
  into top_produits
  from (
    select nom_produit, sum(quantite) as quantite
    from lignes_commande lc
    join commandes c on c.id = lc.commande_id
    where c.statut_commande not in ('ANNULEE', 'RETOURNEE')
    group by nom_produit
    order by quantite desc
    limit 5
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object('nom', nom, 'stock', stock, 'seuil', seuil)), '[]'::jsonb)
  into stock_faible
  from (
    select nom, quantite_stock as stock, seuil_stock_faible as seuil
    from produits
    where quantite_stock <= seuil_stock_faible
    order by quantite_stock asc
    limit 10
  ) sf;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'numero_commande', numero_commande,
    'nom_client', nom_client,
    'montant_total', montant_total,
    'statut_commande', statut_commande,
    'date_creation', date_creation
  ) order by date_creation desc), '[]'::jsonb)
  into commandes_recentes
  from (select * from commandes order by date_creation desc limit 8) cr;

  resultat := jsonb_build_object(
    'compteurs', jsonb_build_object(
      'en_attente', en_attente,
      'confirmees', confirmees,
      'en_preparation', preparation,
      'expediees', expediees,
      'livrees', livrees,
      'annulees', annulees,
      'total', en_attente + confirmees + preparation + expediees + livrees + annulees
    ),
    'montant_en_attente', montant_attente,
    'chiffre_affaires_confirme', ca_confirme,
    'ventes_30_jours', ventes_jour,
    'produits_plus_vendus', top_produits,
    'stock_faible', stock_faible,
    'commandes_recentes', commandes_recentes
  );

  return resultat;
end;
$$;

revoke all on function statistiques_tableau_de_bord() from anon;
grant execute on function statistiques_tableau_de_bord() to authenticated;
