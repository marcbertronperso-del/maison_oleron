import Image from "next/image";
import {
  Bed,
  Car,
  ChefHat,
  Flame,
  Home,
  MapPin,
  TreePine,
  Tv,
  Umbrella,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import { type Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { photos as photosTable } from "~/server/db/schema";
import { GaleriePhotos } from "~/components/galerie/GaleriePhotos";
import { DisponibilitesSection } from "~/components/booking/DisponibilitesSection";
import { ContactForm } from "~/components/contact/ContactForm";

const DESCRIPTION =
  "Maison familiale 9 personnes à 200 m de la plage de Saint-Denis-d'Oléron. Jardin 1 000 m², 4 chambres, terrasse, barbecue. Réservation en ligne.";

export const metadata: Metadata = {
  title: {
    absolute: "Location Maison Oléron — Saint-Denis-d'Oléron, Île d'Oléron",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Location Maison Oléron — Saint-Denis-d'Oléron, Île d'Oléron",
    description: DESCRIPTION,
    images: ["/hero.jpg"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": ["LodgingBusiness", "Accommodation"],
  name: "Maison Oléron",
  url: "https://maison-oleron.fr",
  address: {
    "@type": "PostalAddress",
    streetAddress: "29 rue d'Antiochas",
    addressLocality: "Saint-Denis-d'Oléron",
    postalCode: "17650",
    addressCountry: "FR",
  },
  occupancy: {
    "@type": "QuantitativeValue",
    maxValue: 9,
  },
  numberOfRooms: 4,
  priceRange: "€€",
};

const PROPERTY_FEATURES = [
  { icon: Users, label: "9 personnes" },
  { icon: Bed, label: "3 chambres — maison principale" },
  { icon: Home, label: "1 chambre — annexe avec salle de bain privée" },
  { icon: TreePine, label: "Jardin 1 000 m²" },
  { icon: Waves, label: "200 m de la plage" },
  { icon: MapPin, label: "5 min à pied du port" },
] as const;

const STATIC_PHOTOS = [
  { src: "/photos/salon.jpg", alt: "Salon lumineux avec canapé" },
  { src: "/photos/cuisine.jpg", alt: "Cuisine entièrement équipée" },
  { src: "/photos/chambre-principale.jpg", alt: "Chambre principale avec lit double" },
  { src: "/photos/chambre-2.jpg", alt: "Chambre avec deux lits simples" },
  { src: "/photos/chambre-3.jpg", alt: "Chambre double vue jardin" },
  { src: "/photos/chambre-annexe.jpg", alt: "Chambre de l'annexe avec salle de bain privée" },
  { src: "/photos/salle-de-bain.jpg", alt: "Salle de bain principale" },
  { src: "/photos/jardin.jpg", alt: "Jardin de 1 000 m² clos" },
  { src: "/photos/terrasse.jpg", alt: "Terrasse avec salon de jardin et barbecue" },
  { src: "/photos/exterieur.jpg", alt: "Vue extérieure de la maison" },
  { src: "/photos/annexe.jpg", alt: "Annexe indépendante" },
  { src: "/photos/plage.jpg", alt: "La plage à 200 m de la maison" },
] as const;

const AMENITIES = [
  { icon: Wifi, label: "Wi-Fi inclus" },
  { icon: Car, label: "Parking privé" },
  { icon: Umbrella, label: "Grande terrasse" },
  { icon: Flame, label: "Barbecue" },
  { icon: ChefHat, label: "Cuisine équipée" },
  { icon: Tv, label: "Télévision" },
  { icon: TreePine, label: "Jardin clos" },
] as const;

export default async function HomePage() {
  const dbPhotos = await db
    .select({ src: photosTable.blob_url, alt: photosTable.alt_text })
    .from(photosTable)
    .where(eq(photosTable.is_active, true))
    .orderBy(asc(photosTable.display_order));

  const galleryPhotos = dbPhotos.length > 0 ? dbPhotos : STATIC_PHOTOS;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <main id="main-content" tabIndex={-1}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        aria-label="Présentation de la propriété"
        className="relative flex h-[90vh] min-h-150 items-end bg-foreground"
      >
        <Image
          src="/hero.jpg"
          alt="Vue extérieure de la Maison Oléron, Saint-Denis-d'Oléron"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* gradient overlay — darkens bottom for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <h1 className="font-heading italic text-[2rem] leading-tight text-white sm:text-5xl lg:text-[4rem]">
            Maison Oléron
          </h1>
          <p className="mt-3 text-base text-white/90 sm:text-xl">
            200&nbsp;m de la plage, Saint-Denis-d&apos;Oléron
          </p>
          <a
            href="#disponibilites"
            className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Voir les disponibilités
          </a>
        </div>
      </section>

      {/* ── La Maison ───────────────────────────────────────────── */}
      <section
        id="maison"
        aria-labelledby="maison-heading"
        className="py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="maison-heading"
            className="font-heading text-3xl text-foreground sm:text-4xl"
          >
            La Maison
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Grande maison familiale au cœur de Saint-Denis-d&apos;Oléron, à deux
            pas de la plage et du port. Un cadre idéal pour des vacances en
            famille ou entre amis, avec une annexe indépendante pour plus
            d&apos;intimité.
          </p>

          <ul
            role="list"
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PROPERTY_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Galerie ─────────────────────────────────────────────── */}
      <section
        id="galerie"
        aria-labelledby="galerie-heading"
        className="py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="galerie-heading"
            className="font-heading text-3xl text-foreground sm:text-4xl"
          >
            Galerie
          </h2>
          <div className="mt-10">
            <GaleriePhotos photos={galleryPhotos} />
          </div>
        </div>
      </section>

      {/* ── Équipements ─────────────────────────────────────────── */}
      <section
        aria-labelledby="equipements-heading"
        className="bg-muted py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="equipements-heading"
            className="font-heading text-3xl text-foreground sm:text-4xl"
          >
            Équipements
          </h2>

          <ul
            role="list"
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {AMENITIES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-sm"
              >
                <Icon
                  className="h-5 w-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-card-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Disponibilités ──────────────────────────────────────── */}
      <section
        id="disponibilites"
        aria-labelledby="disponibilites-heading"
        className="py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="disponibilites-heading"
            className="font-heading text-3xl text-foreground sm:text-4xl"
          >
            Disponibilités &amp; Réservation
          </h2>
          <div className="mt-10">
            <DisponibilitesSection />
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="bg-muted py-16 sm:py-24"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2
            id="contact-heading"
            className="font-heading text-3xl text-foreground sm:text-4xl"
          >
            Nous contacter
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Une question sur la maison, les disponibilités ou les tarifs ?
            Envoyez-nous un message, nous vous répondrons rapidement.
          </p>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
