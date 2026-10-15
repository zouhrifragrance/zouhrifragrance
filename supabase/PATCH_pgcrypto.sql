-- =============================================================================
-- ZOUHRI FRAGRANCE - Correctif pgcrypto (search_path)
-- A executer dans Supabase Studio > SQL Editor > New query > Run
-- -----------------------------------------------------------------------------
-- Contexte : pgcrypto est installe dans le schema "extensions" (convention
-- Supabase). Les fonctions ci-dessous tournent avec "search_path = public" et
-- ne resolvent donc pas gen_random_bytes() / digest() -> erreur 42883
-- "function gen_random_bytes(integer) does not exist" lors de la commande.
-- =============================================================================

alter function public.generer_numero_commande() set search_path = public, extensions;
alter function public.creer_commande(jsonb, text) set search_path = public, extensions;
alter function public.suivre_commande(text) set search_path = public, extensions;
