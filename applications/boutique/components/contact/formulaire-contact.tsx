"use client";

import * as React from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { contactSchema } from "@/schemas";

interface FormulaireContactProps {
  whatsappNumero: string;
  emailContact: string;
}

type Champ = "nom" | "telephone" | "email" | "message";
type Erreurs = Partial<Record<Champ, string>>;

function NormaliserTelephone(numero: string): string {
  return numero.replace(/[^0-9]/g, "");
}

export function FormulaireContact({ whatsappNumero, emailContact }: FormulaireContactProps) {
  const [valeurs, setValeurs] = React.useState({
    nom: "",
    telephone: "",
    email: "",
    message: "",
  });
  const [erreurs, setErreurs] = React.useState<Erreurs>({});
  const [envoye, setEnvoye] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  const canal = whatsappNumero
    ? "whatsapp"
    : emailContact
      ? "email"
      : null;

  function modifier(champ: Champ, valeur: string) {
    setValeurs((precedent) => ({ ...precedent, [champ]: valeur }));
    setErreurs((precedent) => ({ ...precedent, [champ]: undefined }));
    setInfo(null);
  }

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const resultat = contactSchema.safeParse(valeurs);
    if (!resultat.success) {
      const nouvellesErreurs: Erreurs = {};
      for (const probleme of resultat.error.issues) {
        const champ = probleme.path[0] as Champ;
        if (champ && !nouvellesErreurs[champ]) nouvellesErreurs[champ] = probleme.message;
      }
      setErreurs(nouvellesErreurs);
      return;
    }

    const donnees = resultat.data;
    const corps = [
      `Bonjour, je suis ${donnees.nom}.`,
      "",
      donnees.message,
      "",
      `Téléphone : ${donnees.telephone}`,
      donnees.email ? `E-mail : ${donnees.email}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (canal === "whatsapp") {
      const url = `https://wa.me/${NormaliserTelephone(whatsappNumero)}?text=${encodeURIComponent(corps)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setEnvoye(true);
    } else if (canal === "email") {
      window.location.href = `mailto:${emailContact}?subject=${encodeURIComponent("Demande via la boutique")}&body=${encodeURIComponent(corps)}`;
      setEnvoye(true);
    } else {
      setInfo(
        "Aucun canal de contact n'est encore configuré. Merci de nous appeler ou de revenir plus tard.",
      );
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4" noValidate>
      {envoye ? (
        <Alert variant="success" titre="Message prêt à être envoyé">
          Votre message a été pré-rempli
          {canal === "whatsapp" ? " dans WhatsApp" : " dans votre logiciel de messagerie"}. Il ne
          reste plus qu&apos;à l&apos;envoyer.
        </Alert>
      ) : null}

      {info ? <Alert variant="warning">{info}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-nom">Nom complet *</Label>
          <Input
            id="contact-nom"
            value={valeurs.nom}
            onChange={(e) => modifier("nom", e.target.value)}
            autoComplete="name"
          />
          {erreurs.nom ? <p className="text-xs font-medium text-red-600">{erreurs.nom}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-telephone">Téléphone *</Label>
          <Input
            id="contact-telephone"
            type="tel"
            value={valeurs.telephone}
            onChange={(e) => modifier("telephone", e.target.value)}
            placeholder="06 12 34 56 78"
            autoComplete="tel"
          />
          {erreurs.telephone ? (
            <p className="text-xs font-medium text-red-600">{erreurs.telephone}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email">E-mail (facultatif)</Label>
        <Input
          id="contact-email"
          type="email"
          value={valeurs.email}
          onChange={(e) => modifier("email", e.target.value)}
          autoComplete="email"
        />
        {erreurs.email ? (
          <p className="text-xs font-medium text-red-600">{erreurs.email}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          value={valeurs.message}
          onChange={(e) => modifier("message", e.target.value)}
          placeholder="Comment pouvons-nous vous aider ?"
          className="min-h-32"
        />
        {erreurs.message ? (
          <p className="text-xs font-medium text-red-600">{erreurs.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {canal === "whatsapp" ? (
          <>
            <MessageCircle className="h-4 w-4" />
            Envoyer via WhatsApp
          </>
        ) : canal === "email" ? (
          <>
            <Mail className="h-4 w-4" />
            Envoyer par e-mail
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Envoyer
          </>
        )}
      </Button>
    </form>
  );
}
