-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0005 : Vues et fonctions d'aide au catalogue
-- =============================================================================

-- Produits les plus vendus, calcules sur les commandes non annulees/retournees.
-- SECURITY DEFINER car lignes_commande n'est pas lisible par le public ;
-- seuls un identifiant produit et une quantite agregee sont exposes.
create or replace function produits_meilleures_ventes(p_limite integer default 8)
returns table (produit_id uuid, total_vendu bigint)
language sql
stable
security definer
set search_path = public
as $$
  select lc.produit_id, sum(lc.quantite)::bigint as total_vendu
  from lignes_commande lc
  join commandes c on c.id = lc.commande_id
  where c.statut_commande not in ('ANNULEE', 'RETOURNEE')
    and lc.produit_id is not null
  group by lc.produit_id
  order by total_vendu desc
  limit greatest(p_limite, 1);
$$;

grant execute on function produits_meilleures_ventes(integer) to anon, authenticated;
