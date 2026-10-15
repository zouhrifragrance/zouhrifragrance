import type { ReactNode } from "react";
import { FilAriane } from "@/components/boutique/fil-ariane";

export interface SectionEditoriale {
  titre: string;
  contenu: ReactNode;
}

interface PageEditorialeProps {
  surtitre: string;
  titre: string;
  chapeau?: string;
  sections: SectionEditoriale[];
  crumb: string;
}

export function PageEditoriale({
  surtitre,
  titre,
  chapeau,
  sections,
  crumb,
}: PageEditorialeProps) {
  return (
    <div className="container-luxe py-8 sm:py-10">
      <FilAriane elements={[{ libelle: "Accueil", href: "/" }, { libelle: crumb }]} />
      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">{surtitre}</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{titre}</h1>
        {chapeau ? <p className="mt-3 text-sm leading-relaxed text-gris sm:text-base">{chapeau}</p> : null}
        <span className="mt-5 block h-px w-16 bg-or" />
      </header>

      <div className="mt-8 max-w-3xl space-y-8">
        {sections.map((section) => (
          <section key={section.titre}>
            <h2 className="font-serif text-xl sm:text-2xl">{section.titre}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-noir/85 sm:text-base">
              {section.contenu}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
