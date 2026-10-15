-- =============================================================================
-- ZOUHRI FRAGRANCE - Donnees de demonstration (environnement de developpement)
-- Ces donnees sont FICTIVES et servent uniquement au developpement.
-- Les images sont des visuels provisoires, pas de vraies photos produits.
-- Ne pas executer tel quel en production.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Roles d'administration
-- -----------------------------------------------------------------------------
insert into roles_utilisateurs (code, libelle, description) values
  ('ADMIN', 'Administrateur', 'Acces complet, y compris les paramètres sensibles.'),
  ('GESTIONNAIRE', 'Gestionnaire', 'Gestion des produits, catégories, commandes et stocks.'),
  ('LECTEUR', 'Lecteur', 'Consultation des données sans modification.')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Parametres de la boutique (valeurs par defaut, modifiables dans l'admin)
-- -----------------------------------------------------------------------------
insert into parametres_boutique (cle, valeur, description) values
  ('identite', jsonb_build_object(
    'nom_boutique', 'ZOUHRI FRAGRANCE',
    'slogan', 'L''art du parfum, à la marocaine',
    'email_contact', '',
    'telephone_contact', '',
    'whatsapp_numero', '',
    'adresse', '',
    'ville', '',
    'pays', 'Maroc'
  ), 'Identité commerciale de la boutique (à compléter).'),
  ('livraison', jsonb_build_object(
    'frais_livraison', 30,
    'seuil_livraison_gratuite', 500,
    'villes_livraison', jsonb_build_array('Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger'),
    'paiement_a_reception', true
  ), 'Règles de livraison et paiement à la réception.'),
  ('stock', jsonb_build_object(
    'reservation_heures', 48,
    'seuil_stock_faible', 5
  ), 'Paramètres de gestion du stock.'),
  ('banniere', jsonb_build_object(
    'active', false,
    'texte', '',
    'lien', ''
  ), 'Bannière promotionnelle de la page d''accueil.'),
  ('seo', jsonb_build_object(
    'titre_defaut', 'ZOUHRI FRAGRANCE — Parfums et cosmétiques au Maroc',
    'description_defaut', 'Boutique de parfums et cosmétiques au Maroc. Fragrances pour homme, femme et mixte, livrées partout au Maroc.'
  ), 'Métadonnées SEO globales.'),
  ('reseaux', jsonb_build_object(
    'instagram', '',
    'facebook', '',
    'tiktok', ''
  ), 'Réseaux sociaux (liens à compléter).')
on conflict (cle) do nothing;

-- -----------------------------------------------------------------------------
-- Categories (parfums + emplacements pour de futures cosmétiques)
-- -----------------------------------------------------------------------------
insert into categories (id, nom, slug, description, categorie_parente_id, ordre_affichage, est_active, titre_seo, description_seo) values
  ('11111111-1111-1111-1111-111111111111', 'Parfums', 'parfums', 'Nos parfums pour homme, femme et mixte.', null, 1, true, 'Parfums au Maroc', 'Découvrez notre sélection de parfums au Maroc.'),
  ('11111111-1111-1111-1111-111111111112', 'Parfums pour homme', 'parfums-homme', 'Des fragrances masculines affirmées et élégantes.', '11111111-1111-1111-1111-111111111111', 1, true, 'Parfums pour homme au Maroc', 'Parfums pour homme, tenue longue durée.'),
  ('11111111-1111-1111-1111-111111111113', 'Parfums pour femme', 'parfums-femme', 'Des fragrances féminines raffinées.', '11111111-1111-1111-1111-111111111111', 2, true, 'Parfums pour femme au Maroc', 'Parfums pour femme, élégance et caractère.'),
  ('11111111-1111-1111-1111-111111111114', 'Parfums mixtes', 'parfums-mixtes', 'Des fragrances unisexes intemporelles.', '11111111-1111-1111-1111-111111111111', 3, true, 'Parfums mixtes au Maroc', 'Parfums mixtes à porter sans distinction.'),
  ('11111111-1111-1111-1111-111111111115', 'Cosmétiques', 'cosmetiques', 'Soins et beauté (catégorie évolutive).', null, 2, true, 'Cosmétiques au Maroc', 'Soins et cosmétiques sélectionnés.'),
  ('11111111-1111-1111-1111-111111111116', 'Soins du visage', 'soins-du-visage', 'Soins pour le visage.', '11111111-1111-1111-1111-111111111115', 1, true, 'Soins du visage au Maroc', 'Soins du visage hydratants et nourrissants.'),
  ('11111111-1111-1111-1111-111111111117', 'Coffrets cadeaux', 'coffrets-cadeaux', 'Des coffrets prêts à offrir.', null, 3, true, 'Coffrets cadeaux parfums au Maroc', 'Coffrets cadeaux parfums et cosmétiques.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Produits de demonstration
-- -----------------------------------------------------------------------------
insert into produits (id, nom, slug, description_courte, description, categorie_id, reference_sku, prix_vente, prix_promotionnel, quantite_stock, seuil_stock_faible, est_mis_en_avant, est_publie, titre_seo, description_seo) values
  ('22222222-2222-2222-2222-222222222221', 'Oud Royal', 'oud-royal', 'Un oud profond et boisé, signature de la maison.', 'Oud Royal est une fragrance boisée et orientale construite autour d''un oud noble, réchauffé par des notes d''épices et de cuir. Idéale pour les grandes occasions.', '11111111-1111-1111-1111-111111111112', 'ZF-OUD-001', 690, 590, 24, 5, true, true, 'Oud Royal — Parfum boisé | ZOUHRI FRAGRANCE', 'Oud Royal, parfum boisé et oriental pour homme. Tenue longue durée. Commande simple au Maroc.'),
  ('22222222-2222-2222-2222-222222222222', 'Fleur de Maroc', 'fleur-de-maroc', 'Un floral lumineux inspiré des jardins marocains.', 'Fleur de Maroc associe la rose, le jasmin et une touche d''agrumes pour un sillage frais et féminin, parfait au quotidien.', '11111111-1111-1111-1111-111111111113', 'ZF-FLR-002', 550, null, 30, 5, true, true, 'Fleur de Maroc — Parfum floral | ZOUHRI FRAGRANCE', 'Fleur de Maroc, parfum floral pour femme. Fraîcheur et élégance au quotidien.'),
  ('22222222-2222-2222-2222-222222222223', 'Ambre Nuit', 'ambre-nuit', 'Ambre chaud et vanillé pour les soirées.', 'Ambre Nuit est une fragrance gourmande et enveloppante, mêlant ambre, vanille et bois précieux. Un parfum mixte pour les soirées.', '11111111-1111-1111-1111-111111111114', 'ZF-AMB-003', 620, 540, 18, 5, true, true, 'Ambre Nuit — Parfum mixte ambré | ZOUHRI FRAGRANCE', 'Ambre Nuit, parfum mixte ambré et vanillé. Pour homme et femme.'),
  ('22222222-2222-2222-2222-222222222224', 'Brise Atlantique', 'brise-atlantique', 'Une eau fraîche aux notes marines.', 'Brise Atlantique évoque les embruns : notes marines, bergamote et bois flotté. Une fragrance mixte idéale en journée.', '11111111-1111-1111-1111-111111111114', 'ZF-BRI-004', 480, null, 40, 8, false, true, 'Brise Atlantique — Eau fraîche mixte | ZOUHRI FRAGRANCE', 'Brise Atlantique, eau fraîche aux notes marines, mixte.'),
  ('22222222-2222-2222-2222-222222222225', 'Huile précieuse d''Argan', 'huile-precieuse-argan', 'Huile d''argan vierge pour la peau et les cheveux.', 'Huile d''argan pressée à froid, riche en vitamine E. Nourrit la peau et sublime les cheveux. Flacon pompe de 100 ml.', '11111111-1111-1111-1111-111111111116', 'ZF-ARG-005', 220, null, 50, 10, false, true, 'Huile précieuse d''Argan | ZOUHRI FRAGRANCE', 'Huile d''argan vierge pressée à froid, soin naturel pour la peau et les cheveux.'),
  ('22222222-2222-2222-2222-222222222226', 'Coffret Découverte', 'coffret-decouverte', 'Trois miniatures pour découvrir la maison.', 'Le Coffret Découverte réunit trois formats de voyage : Oud Royal, Fleur de Maroc et Ambre Nuit. Idéal pour offrir.', '11111111-1111-1111-1111-111111111117', 'ZF-COF-006', 350, 299, 12, 4, true, true, 'Coffret Découverte — Trio de parfums | ZOUHRI FRAGRANCE', 'Coffret Découverte : trois miniatures de parfums ZOUHRI FRAGRANCE à offrir.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Images de produits (visuels provisoires)
-- -----------------------------------------------------------------------------
insert into images_produits (produit_id, url, texte_alt, est_principale, ordre_affichage) values
  ('22222222-2222-2222-2222-222222222221', '/images/produit-provisoire.svg', 'Visuel provisoire — Oud Royal', true, 0),
  ('22222222-2222-2222-2222-222222222222', '/images/produit-provisoire.svg', 'Visuel provisoire — Fleur de Maroc', true, 0),
  ('22222222-2222-2222-2222-222222222223', '/images/produit-provisoire.svg', 'Visuel provisoire — Ambre Nuit', true, 0),
  ('22222222-2222-2222-2222-222222222224', '/images/produit-provisoire.svg', 'Visuel provisoire — Brise Atlantique', true, 0),
  ('22222222-2222-2222-2222-222222222225', '/images/produit-provisoire.svg', 'Visuel provisoire — Huile d''Argan', true, 0),
  ('22222222-2222-2222-2222-222222222226', '/images/produit-provisoire.svg', 'Visuel provisoire — Coffret Découverte', true, 0)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Variantes (contenances) pour les parfums
-- -----------------------------------------------------------------------------
insert into variantes_produit (produit_id, nom, contenance, reference_sku, prix_vente, quantite_stock, seuil_stock_faible, ordre_affichage) values
  ('22222222-2222-2222-2222-222222222221', '50 ml', '50 ml', 'ZF-OUD-001-50', 420, 14, 4, 1),
  ('22222222-2222-2222-2222-222222222221', '100 ml', '100 ml', 'ZF-OUD-001-100', 690, 10, 4, 2),
  ('22222222-2222-2222-2222-222222222222', '50 ml', '50 ml', 'ZF-FLR-002-50', 350, 18, 4, 1),
  ('22222222-2222-2222-2222-222222222222', '100 ml', '100 ml', 'ZF-FLR-002-100', 550, 12, 4, 2),
  ('22222222-2222-2222-2222-222222222223', '50 ml', '50 ml', 'ZF-AMB-003-50', 380, 11, 4, 1),
  ('22222222-2222-2222-2222-222222222223', '100 ml', '100 ml', 'ZF-AMB-003-100', 620, 7, 4, 2)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Promotion de demonstration
-- -----------------------------------------------------------------------------
insert into promotions (code, nom, type_reduction, valeur, montant_minimum, limite_utilisation, date_debut, date_fin, est_active) values
  ('BIENVENUE10', 'Bienvenue - 10 %', 'POURCENTAGE', 10, 300, 100, now() - interval '1 day', now() + interval '90 days', true)
on conflict (code) do nothing;
