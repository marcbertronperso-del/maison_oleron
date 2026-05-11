import { type Metadata } from "next";
import { Anchor, ShoppingBag, Waves } from "lucide-react";
import { CarteLocalisation } from "~/components/acces/CarteLocalisation";

export const metadata: Metadata = {
  title: "Accès & Localisation",
  description:
    "Maison Oléron à Saint-Denis-d'Oléron : à 200 m de la plage, 5 min à pied du port, 15 min du marché. Plan d'accès interactif.",
};

const DISTANCES = [
  {
    icon: Waves,
    label: "Plage",
    value: "200 m à pied",
  },
  {
    icon: Anchor,
    label: "Port de Saint-Denis",
    value: "5 min à pied",
  },
  {
    icon: ShoppingBag,
    label: "Marché",
    value: "15 min à pied",
  },
] as const;

export default function AccesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-16">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="font-heading text-3xl text-foreground sm:text-4xl">
          Accès &amp; Localisation
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          La maison se trouve au cœur de Saint-Denis-d&apos;Oléron, à deux pas
          de la plage et du port de plaisance.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          29 rue d&apos;Antiochas — 17650 Saint-Denis-d&apos;Oléron
        </p>

        {/* Map with toggle and fallback */}
        <div className="mt-12">
          <CarteLocalisation />
        </div>

        {/* Distances */}
        <section
          aria-labelledby="distances-heading"
          className="mt-16"
        >
          <h2
            id="distances-heading"
            className="font-heading text-2xl text-foreground sm:text-3xl"
          >
            À proximité
          </h2>
          <ul
            role="list"
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {DISTANCES.map(({ icon: Icon, label, value }) => (
              <li
                key={label}
                className="flex items-center gap-4 rounded-lg bg-card px-6 py-5 shadow-sm"
              >
                <Icon
                  className="h-6 w-6 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
