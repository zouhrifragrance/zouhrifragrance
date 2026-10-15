-- =============================================================================
-- ZOUHRI FRAGRANCE - Correctif : suivi de commande sans lien
-- A executer dans Supabase Studio > SQL Editor > New query > Run
-- Ajoute la fonction suivre_commande_par_contact.
-- Permet au client de retrouver sa commande avec le numero de commande et le
-- telephone utilise lors de la commande (s'il a perdu son lien de suivi).
-- =============================================================================

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
