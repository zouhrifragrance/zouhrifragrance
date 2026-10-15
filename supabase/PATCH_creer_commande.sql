-- =============================================================================
-- ZOUHRI FRAGRANCE - Correctif fonction creer_commande
-- A executer dans Supabase Studio > SQL Editor > New query > Run
-- Corrige : pgcrypto (search_path extensions) + ambiguite variable/colonne
--            sous_total (renommee v_sous_total).
-- =============================================================================

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
      raise exception 'QuantitÃ© invalide.' using errcode = '22000';
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
      values (produit.id, variante.id, 'RESERVATION', -quantite_demandee, 'RÃ©servation Ã  la crÃ©ation de commande', nouvelle_commande.id);

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
      values (produit.id, 'RESERVATION', -quantite_demandee, 'RÃ©servation Ã  la crÃ©ation de commande', nouvelle_commande.id);

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
  values (nouvelle_commande.id, null, 'EN_ATTENTE_CONFIRMATION', 'Commande crÃ©Ã©e par le client.', 'CLIENT');

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
