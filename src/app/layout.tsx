import "~/styles/globals.css";

import { type Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.maloloantiochas.fr"),
  title: { default: "Maison Antiochas — Location Vacances Saint-Denis-d'Oléron", template: "%s — Maison Antiochas" },
  description: "Location saisonnière à Saint-Denis-d'Oléron, rue d'Antiochas. Maison 9 personnes, 4 chambres, jardin 1 000 m², 200 m de la plage.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${dmSerifDisplay.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
