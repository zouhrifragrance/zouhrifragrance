import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Administration",
    template: "%s · Administration ZOUHRI FRAGRANCE",
  },
  robots: { index: false, follow: false },
};

export default function LayoutAdminRacine({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
