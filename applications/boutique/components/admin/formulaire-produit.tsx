"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { GripVertical, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { actionEnregistrerProduit, type EtatProduitAdmin } from "@/app/actions/admin-produits";
import { produitSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ImageProduit } from "@/components/brand/image-produit";
import { slugifier } from "@/lib/utils";
import {
  supprimerImagesMedias,
  televerserImage,
  validerFichierImage,
} from "@/lib/supabase/storage";

export interface ProduitInitial {
  id: string;
  nom: string;
  slug: string;
  description_courte: string | null;
  description: string | null;
  categorie_id: string | null;
  reference_sku: string | null;
  prix_vente: number;
  prix_promotionnel: number | null;
  devise: string;
  quantite_stock: number;
  seuil_stock_faible: number;
  est_mis_en_avant: boolean;
  est_publie: boolean;
  titre_seo: string | null;
  description_seo: string | null;
  images: { url: string; texte_alt: string | null; est_principale: boolean }[];
  variantes: {
    nom: string;
    contenance: string | null;
    reference_sku: string | null;
    prix_vente: number | null;
    prix_promotionnel: number | null;
    quantite_stock: number;
    seuil_stock_faible: number;
    est_active: boolean;
  }[];
}

interface ImageForm {
  url: string;
  texte_alt: string;
  est_principale: boolean;
}

interface VarianteForm {
  nom: string;
  contenance: string;
  reference_sku: string;
  prix_vente: string;
  prix_promotionnel: string;
  quantite_stock: string;
  seuil_stock_faible: string;
  est_active: boolean;
}

const ETAT_INITIAL: EtatProduitAdmin = { ok: true, message: "" };

function imageVide(): ImageForm {
  return { url: "", texte_alt: "", est_principale: false };
}

function varianteVide(): VarianteForm {
  return {
    nom: "",
    contenance: "",
    reference_sku: "",
    prix_vente: "",
    prix_promotionnel: "",
    quantite_stock: "0",
    seuil_stock_faible: "5",
    est_active: true,
  };
}

export function FormulaireProduit({
  categories,
  produit,
}: {
  categories: { id: string; nom: string }[];
  produit?: ProduitInitial;
}) {
  const [etat, action, enCours] = useActionState(actionEnregistrerProduit, ETAT_INITIAL);

  const [nom, setNom] = React.useState(produit?.nom ?? "");
  const [slug, setSlug] = React.useState(produit?.slug ?? "");
  const [slugManuel, setSlugManuel] = React.useState(Boolean(produit));
  const [descriptionCourte, setDescriptionCourte] = React.useState(produit?.description_courte ?? "");
  const [description, setDescription] = React.useState(produit?.description ?? "");
  const [categorieId, setCategorieId] = React.useState(produit?.categorie_id ?? "");
  const [referenceSku, setReferenceSku] = React.useState(produit?.reference_sku ?? "");
  const [prixVente, setPrixVente] = React.useState(String(produit?.prix_vente ?? ""));
  const [prixPromotionnel, setPrixPromotionnel] = React.useState(
    produit?.prix_promotionnel != null ? String(produit.prix_promotionnel) : "",
  );
  const [devise, setDevise] = React.useState(produit?.devise ?? "MAD");
  const [quantiteStock, setQuantiteStock] = React.useState(String(produit?.quantite_stock ?? "0"));
  const [seuilStockFaible, setSeuilStockFaible] = React.useState(
    String(produit?.seuil_stock_faible ?? "5"),
  );
  const [estMisEnAvant, setEstMisEnAvant] = React.useState(produit?.est_mis_en_avant ?? false);
  const [estPublie, setEstPublie] = React.useState(produit?.est_publie ?? false);
  const [titreSeo, setTitreSeo] = React.useState(produit?.titre_seo ?? "");
  const [descriptionSeo, setDescriptionSeo] = React.useState(produit?.description_seo ?? "");
  const [images, setImages] = React.useState<ImageForm[]>(
    produit?.images.map((image) => ({
      url: image.url,
      texte_alt: image.texte_alt ?? "",
      est_principale: image.est_principale,
    })) ?? [imageVide()],
  );
  const [variantes, setVariantes] = React.useState<VarianteForm[]>(
    produit?.variantes.map((variante) => ({
      nom: variante.nom,
      contenance: variante.contenance ?? "",
      reference_sku: variante.reference_sku ?? "",
      prix_vente: variante.prix_vente != null ? String(variante.prix_vente) : "",
      prix_promotionnel:
        variante.prix_promotionnel != null ? String(variante.prix_promotionnel) : "",
      quantite_stock: String(variante.quantite_stock),
      seuil_stock_faible: String(variante.seuil_stock_faible),
      est_active: variante.est_active,
    })) ?? [],
  );
  const [erreurs, setErreurs] = React.useState<Record<string, string>>({});
  const [uploadsEnCours, setUploadsEnCours] = React.useState<ReadonlySet<number>>(new Set());
  const [erreursUpload, setErreursUpload] = React.useState<Record<number, string>>({});
  const alerteRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (etat.message) {
      alerteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [etat]);

  React.useEffect(() => {
    if (!slugManuel) setSlug(slugifier(nom));
  }, [nom, slugManuel]);

  const payload = React.useMemo(
    () => ({
      nom,
      slug,
      description_courte: descriptionCourte,
      description,
      categorie_id: categorieId || "",
      reference_sku: referenceSku,
      prix_vente: prixVente === "" ? 0 : Number(prixVente),
      prix_promotionnel: prixPromotionnel === "" ? null : Number(prixPromotionnel),
      devise: devise || "MAD",
      quantite_stock: quantiteStock === "" ? 0 : Number(quantiteStock),
      seuil_stock_faible: seuilStockFaible === "" ? 0 : Number(seuilStockFaible),
      est_mis_en_avant: estMisEnAvant,
      est_publie: estPublie,
      titre_seo: titreSeo,
      description_seo: descriptionSeo,
      images: images
        .filter((image) => image.url.trim())
        .map((image, index) => ({
          url: image.url.trim(),
          texte_alt: image.texte_alt,
          est_principale: image.est_principale || index === 0,
          ordre_affichage: index,
        })),
      variantes: variantes
        .filter((variante) => variante.nom.trim())
        .map((variante, index) => ({
          nom: variante.nom,
          contenance: variante.contenance,
          reference_sku: variante.reference_sku,
          prix_vente: variante.prix_vente === "" ? null : Number(variante.prix_vente),
          prix_promotionnel:
            variante.prix_promotionnel === "" ? null : Number(variante.prix_promotionnel),
          quantite_stock: variante.quantite_stock === "" ? 0 : Number(variante.quantite_stock),
          seuil_stock_faible:
            variante.seuil_stock_faible === "" ? 0 : Number(variante.seuil_stock_faible),
          est_active: variante.est_active,
          ordre_affichage: index,
        })),
    }),
    [
      nom,
      slug,
      descriptionCourte,
      description,
      categorieId,
      referenceSku,
      prixVente,
      prixPromotionnel,
      devise,
      quantiteStock,
      seuilStockFaible,
      estMisEnAvant,
      estPublie,
      titreSeo,
      descriptionSeo,
      images,
      variantes,
    ],
  );

  function valider(evenement: React.FormEvent<HTMLFormElement>) {
    const resultat = produitSchema.safeParse(payload);
    if (!resultat.success) {
      evenement.preventDefault();
      const nouvellesErreurs: Record<string, string> = {};
      for (const probleme of resultat.error.issues) {
        const cle = probleme.path.join(".");
        if (!nouvellesErreurs[cle]) nouvellesErreurs[cle] = probleme.message;
      }
      setErreurs(nouvellesErreurs);
      return;
    }
    setErreurs({});
  }

  function modifierImage(index: number, champ: keyof ImageForm, valeur: string | boolean) {
    setImages((precedent) =>
      precedent.map((image, i) => (i === index ? { ...image, [champ]: valeur } : image)),
    );
  }

  async function choisirFichier(index: number, fichier: File | undefined) {
    if (!fichier) return;

    const erreurValidation = validerFichierImage(fichier);
    if (erreurValidation) {
      setErreursUpload((p) => ({ ...p, [index]: erreurValidation }));
      return;
    }

    setErreursUpload((p) => ({ ...p, [index]: "" }));
    setUploadsEnCours((p) => new Set(p).add(index));
    try {
      const url = await televerserImage(fichier);
      modifierImage(index, "url", url);
    } catch (erreur) {
      setErreursUpload((p) => ({
        ...p,
        [index]: erreur instanceof Error ? erreur.message : "Échec du téléversement.",
      }));
    } finally {
      setUploadsEnCours((p) => {
        const suivant = new Set(p);
        suivant.delete(index);
        return suivant;
      });
    }
  }

  function retirerImage(index: number) {
    const url = images[index]?.url;
    if (url) {
      supprimerImagesMedias([url]).catch(() => undefined);
    }
    setImages((p) => p.filter((_, i) => i !== index));
    setErreursUpload((p) => {
      const suivant = { ...p };
      delete suivant[index];
      return suivant;
    });
  }

  function modifierVariante(index: number, champ: keyof VarianteForm, valeur: string | boolean) {
    setVariantes((precedent) =>
      precedent.map((variante, i) => (i === index ? { ...variante, [champ]: valeur } : variante)),
    );
  }

  return (
    <form action={action} onSubmit={valider} className="space-y-6">
      <input type="hidden" name="donnees" value={JSON.stringify(payload)} />
      {produit ? <input type="hidden" name="produit_id" value={produit.id} /> : null}

      {etat.message ? (
        <div ref={alerteRef}>
          <Alert variant={etat.ok ? "success" : "danger"}>
            {etat.message}
            {etat.ok && etat.produitId ? (
              <span className="mt-1 block">
                <Link href={`/admin/produits/${etat.produitId}`} className="underline">
                  Modifier à nouveau
                </Link>
              </span>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Informations</h2>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom du produit *</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
              {erreurs.nom ? <p className="text-xs text-red-600">{erreurs.nom}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuel(true);
                }}
              />
              {erreurs.slug ? <p className="text-xs text-red-600">{erreurs.slug}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description_courte">Description courte</Label>
              <Textarea
                id="description_courte"
                value={descriptionCourte}
                onChange={(e) => setDescriptionCourte(e.target.value)}
                className="min-h-16"
                maxLength={280}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description complète</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-40"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="categorie">Catégorie</Label>
                <select
                  id="categorie"
                  value={categorieId}
                  onChange={(e) => setCategorieId(e.target.value)}
                  className="h-11 w-full rounded-md border border-bordure bg-white px-3 text-sm focus-visible:border-or focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
                >
                  <option value="">Aucune</option>
                  {categories.map((categorie) => (
                    <option key={categorie.id} value={categorie.id}>
                      {categorie.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference">Référence (SKU)</Label>
                <Input
                  id="reference"
                  value={referenceSku}
                  onChange={(e) => setReferenceSku(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Variantes</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariantes((p) => [...p, varianteVide()])}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-gris">
              Laissez vide si le produit n&apos;a pas de déclinaison (contenance, taille…).
            </p>
            {variantes.length === 0 ? (
              <p className="text-sm text-gris">Aucune variante.</p>
            ) : (
              <div className="space-y-4">
                {variantes.map((variante, index) => (
                  <div key={index} className="rounded-lg border border-bordure p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <GripVertical className="h-4 w-4 text-gris-clair" />
                        Variante {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer la variante"
                        onClick={() => setVariantes((p) => p.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Nom (ex : 50 ml)"
                        value={variante.nom}
                        onChange={(e) => modifierVariante(index, "nom", e.target.value)}
                      />
                      <Input
                        placeholder="Contenance"
                        value={variante.contenance}
                        onChange={(e) => modifierVariante(index, "contenance", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Prix de vente"
                        value={variante.prix_vente}
                        onChange={(e) => modifierVariante(index, "prix_vente", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Prix promotionnel"
                        value={variante.prix_promotionnel}
                        onChange={(e) => modifierVariante(index, "prix_promotionnel", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={variante.quantite_stock}
                        onChange={(e) => modifierVariante(index, "quantite_stock", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Seuil stock faible"
                        value={variante.seuil_stock_faible}
                        onChange={(e) => modifierVariante(index, "seuil_stock_faible", e.target.value)}
                      />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={variante.est_active}
                        onCheckedChange={(v) => modifierVariante(index, "est_active", v === true)}
                      />
                      Variante active
                    </label>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Images</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImages((p) => [...p, imageVide()])}
                disabled={images.length >= 8}
              >
                <ImagePlus className="h-4 w-4" />
                Ajouter une image
              </Button>
            </div>
            <p className="text-xs text-gris">
              Téléversez des images (JPEG, PNG, WebP, AVIF ou GIF, 5 Mo maximum, 8 au total). La
              première est utilisée par défaut comme image principale.
            </p>
            {images.map((image, index) => (
              <div key={index} className="flex gap-3 rounded-lg border border-bordure p-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-ivoire">
                  <ImageProduit src={image.url || null} alt={image.texte_alt || nom} sizes="64px" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="h-9 text-xs"
                      disabled={uploadsEnCours.has(index)}
                      onChange={(e) => {
                        const fichier = e.target.files?.[0];
                        e.target.value = "";
                        void choisirFichier(index, fichier);
                      }}
                    />
                    {uploadsEnCours.has(index) ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gris" />
                    ) : null}
                  </div>
                  {image.url ? (
                    <p className="truncate text-xs text-gris" title={image.url}>
                      {image.url}
                    </p>
                  ) : null}
                  {erreursUpload[index] ? (
                    <p className="text-xs text-red-600">{erreursUpload[index]}</p>
                  ) : null}
                  <Input
                    placeholder="Texte alternatif"
                    value={image.texte_alt}
                    onChange={(e) => modifierImage(index, "texte_alt", e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs text-gris">
                    <Checkbox
                      checked={image.est_principale}
                      onCheckedChange={(v) => modifierImage(index, "est_principale", v === true)}
                    />
                    Image principale
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer l'image"
                  onClick={() => retirerImage(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            {erreurs["images"] ? <p className="text-xs text-red-600">{erreurs["images"]}</p> : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Prix & stock</h2>
            <div className="space-y-1.5">
              <Label htmlFor="prix_vente">Prix de vente *</Label>
              <Input
                id="prix_vente"
                type="number"
                value={prixVente}
                onChange={(e) => setPrixVente(e.target.value)}
              />
              {erreurs.prix_vente ? (
                <p className="text-xs text-red-600">{erreurs.prix_vente}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prix_promotionnel">Prix promotionnel</Label>
              <Input
                id="prix_promotionnel"
                type="number"
                value={prixPromotionnel}
                onChange={(e) => setPrixPromotionnel(e.target.value)}
              />
              {erreurs.prix_promotionnel ? (
                <p className="text-xs text-red-600">{erreurs.prix_promotionnel}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="devise">Devise</Label>
                <Input id="devise" value={devise} onChange={(e) => setDevise(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seuil">Seuil stock faible</Label>
                <Input
                  id="seuil"
                  type="number"
                  value={seuilStockFaible}
                  onChange={(e) => setSeuilStockFaible(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">
                Stock{produit ? " (modifiable via la page Stocks)" : " initial"}
              </Label>
              <Input
                id="stock"
                type="number"
                value={quantiteStock}
                onChange={(e) => setQuantiteStock(e.target.value)}
                disabled={Boolean(produit)}
              />
              {produit ? (
                <p className="text-xs text-gris">
                  Utilisez la page Stocks pour ajuster le stock (traçabilité des mouvements).
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Publication</h2>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={estPublie}
                onCheckedChange={(v) => setEstPublie(v === true)}
              />
              Publier le produit sur la boutique
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={estMisEnAvant}
                onCheckedChange={(v) => setEstMisEnAvant(v === true)}
              />
              Mettre en avant (page d&apos;accueil)
            </label>
          </section>

          <section className="space-y-4 rounded-xl border border-bordure bg-white p-5">
            <h2 className="font-serif text-lg">Référencement (SEO)</h2>
            <div className="space-y-1.5">
              <Label htmlFor="titre_seo">Titre SEO</Label>
              <Input
                id="titre_seo"
                value={titreSeo}
                onChange={(e) => setTitreSeo(e.target.value)}
                maxLength={70}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description_seo">Description SEO</Label>
              <Textarea
                id="description_seo"
                value={descriptionSeo}
                onChange={(e) => setDescriptionSeo(e.target.value)}
                className="min-h-20"
                maxLength={180}
              />
            </div>
          </section>

          <div className="sticky bottom-4 space-y-3">
            <Separator />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={enCours || uploadsEnCours.size > 0}>
                {enCours || uploadsEnCours.size > 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/produits">Annuler</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
