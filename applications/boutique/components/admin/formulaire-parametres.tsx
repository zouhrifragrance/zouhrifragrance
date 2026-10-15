"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { actionEnregistrerParametres } from "@/app/actions/admin-parametres";
import type { EtatActionAdmin } from "@/app/actions/admin-commandes";
import type { ParametresBoutique } from "@/services/parametres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";

const ETAT_INITIAL: EtatActionAdmin = { ok: true, message: "" };

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
      <h2 className="font-serif text-lg">{titre}</h2>
      {children}
    </section>
  );
}

export function FormulaireParametres({ parametres }: { parametres: ParametresBoutique }) {
  const [etat, action, enCours] = useActionState(actionEnregistrerParametres, ETAT_INITIAL);

  return (
    <form action={action} className="max-w-3xl space-y-6">
      {etat.message ? <Alert variant={etat.ok ? "success" : "danger"}>{etat.message}</Alert> : null}

      <Carte titre="Identité de la boutique">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nom_boutique">Nom de la boutique *</Label>
            <Input id="nom_boutique" name="nom_boutique" defaultValue={parametres.identite.nom_boutique} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slogan">Slogan</Label>
            <Input id="slogan" name="slogan" defaultValue={parametres.identite.slogan} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email_contact">E-mail de contact</Label>
            <Input id="email_contact" name="email_contact" type="email" defaultValue={parametres.identite.email_contact} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone_contact">Téléphone</Label>
            <Input id="telephone_contact" name="telephone_contact" defaultValue={parametres.identite.telephone_contact} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp_numero">Numéro WhatsApp</Label>
            <Input id="whatsapp_numero" name="whatsapp_numero" defaultValue={parametres.identite.whatsapp_numero} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" name="adresse" defaultValue={parametres.identite.adresse} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" name="ville" defaultValue={parametres.identite.ville} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pays">Pays</Label>
            <Input id="pays" name="pays" defaultValue={parametres.identite.pays} />
          </div>
        </div>
      </Carte>

      <Carte titre="Livraison">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="frais_livraison">Frais de livraison (MAD)</Label>
            <Input id="frais_livraison" name="frais_livraison" type="number" min={0} defaultValue={parametres.livraison.frais_livraison} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seuil_livraison_gratuite">Seuil de livraison gratuite (MAD)</Label>
            <Input
              id="seuil_livraison_gratuite"
              name="seuil_livraison_gratuite"
              type="number"
              min={0}
              defaultValue={parametres.livraison.seuil_livraison_gratuite}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="villes_livraison">Villes livrées (une par ligne)</Label>
          <Textarea
            id="villes_livraison"
            name="villes_livraison"
            rows={4}
            defaultValue={parametres.livraison.villes_livraison.join("\n")}
            placeholder={"Casablanca\nRabat\nMarrakech"}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="paiement_a_reception" defaultChecked={parametres.livraison.paiement_a_reception} />
          Paiement à la réception activé
        </label>
      </Carte>

      <Carte titre="Stock">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stock_reservation_heures">Durée de réservation (heures)</Label>
            <Input
              id="stock_reservation_heures"
              name="stock_reservation_heures"
              type="number"
              min={1}
              defaultValue={parametres.stock.reservation_heures}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seuil_stock_faible">Seuil de stock faible</Label>
            <Input
              id="seuil_stock_faible"
              name="seuil_stock_faible"
              type="number"
              min={0}
              defaultValue={parametres.stock.seuil_stock_faible}
            />
          </div>
        </div>
      </Carte>

      <Carte titre="Bannière d'annonce">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="banniere_active" defaultChecked={parametres.banniere.active} />
          Afficher la bannière en haut du site
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="banniere_texte">Texte</Label>
            <Input id="banniere_texte" name="banniere_texte" defaultValue={parametres.banniere.texte} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="banniere_lien">Lien</Label>
            <Input id="banniere_lien" name="banniere_lien" defaultValue={parametres.banniere.lien} />
          </div>
        </div>
      </Carte>

      <Carte titre="Référencement (SEO)">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="seo_titre_defaut">Titre par défaut</Label>
            <Input id="seo_titre_defaut" name="seo_titre_defaut" defaultValue={parametres.seo.titre_defaut} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo_description_defaut">Description par défaut</Label>
            <Textarea
              id="seo_description_defaut"
              name="seo_description_defaut"
              rows={3}
              defaultValue={parametres.seo.description_defaut}
            />
          </div>
        </div>
      </Carte>

      <Carte titre="Réseaux sociaux">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={parametres.reseaux.instagram} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" name="facebook" defaultValue={parametres.reseaux.facebook} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input id="tiktok" name="tiktok" defaultValue={parametres.reseaux.tiktok} />
          </div>
        </div>
      </Carte>

      <Button type="submit" disabled={enCours}>
        {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Enregistrer les paramètres
      </Button>
    </form>
  );
}
