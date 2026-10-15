import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import { FournisseurPanier } from "@/hooks/use-panier";
import { Toaster } from "@/components/ui/toaster";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${siteConfig.nom} — Parfums et cosmétiques au Maroc`,
    template: `%s | ${siteConfig.nom}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.nom,
  keywords: [...siteConfig.motClePrincipaux],
  authors: [{ name: siteConfig.nom }],
  creator: siteConfig.nom,
  publisher: siteConfig.nom,
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: env.siteUrl,
    siteName: siteConfig.nom,
    title: `${siteConfig.nom} — Parfums et cosmétiques au Maroc`,
    description: siteConfig.description,
    images: [{ url: siteConfig.logo, width: 1200, height: 1200, alt: siteConfig.nom }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.nom}`,
    description: siteConfig.description,
    images: [siteConfig.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/logo-zouhri.png" }],
    apple: [{ url: "/logo-zouhri.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#B58A3A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>
        <FournisseurPanier>
          {children}
          <Toaster />
        </FournisseurPanier>
      </body>
    </html>
  );
}
