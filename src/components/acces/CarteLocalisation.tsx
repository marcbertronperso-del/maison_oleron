"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { env } from "~/env";

const ADDRESS = "29 rue d'Antiochas, 17650 Saint-Denis-d'Oléron";
const ADDRESS_ENCODED = encodeURIComponent(ADDRESS);
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${ADDRESS_ENCODED}`;

type MapType = "roadmap" | "satellite";

const MAP_TYPES: MapType[] = ["roadmap", "satellite"];

export function CarteLocalisation() {
  const [mapType, setMapType] = useState<MapType>("roadmap");

  // env validates the key via zod (emptyStringAsUndefined: true) — no empty-string bypass
  const mapsKey = env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const hasMap = !!mapsKey;

  const embedUrl = (type: MapType) =>
    `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${ADDRESS_ENCODED}&zoom=15&maptype=${type}`;

  return (
    <div>
      {/* View toggle — only shown when the API key is configured */}
      {hasMap && (
        <div className="mb-4 flex gap-2" role="group" aria-label="Type de carte">
          <button
            type="button"
            onClick={() => setMapType("roadmap")}
            aria-pressed={mapType === "roadmap"}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mapType === "roadmap"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Plan
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            aria-pressed={mapType === "satellite"}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mapType === "satellite"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Satellite
          </button>
        </div>
      )}

      {/* Map container — same dimensions for both iframe and fallback (NFR21) */}
      <div className="relative h-96 w-full overflow-hidden rounded-lg sm:h-112">
        {hasMap ? (
          // Dual iframes pre-loaded simultaneously — toggling opacity avoids a full reload
          // on each mapType change (display:none would pause iframe loading)
          MAP_TYPES.map((type) => (
            <iframe
              key={type}
              src={embedUrl(type)}
              title={
                type === mapType
                  ? "Carte de localisation — Maison Oléron, Saint-Denis-d'Oléron"
                  : ""
              }
              aria-hidden={type !== mapType}
              className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ${
                type === mapType ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ))
        ) : (
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block h-full w-full overflow-hidden rounded-lg"
            aria-label="Ouvrir la localisation dans Google Maps (nouvelle fenêtre)"
          >
            <Image
              src="/acces.jpg"
              alt="Vue aérienne de Saint-Denis-d'Oléron"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) calc(100vw - 3rem), 1232px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow">
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              Voir sur Google Maps
            </div>
          </a>
        )}
      </div>

      {/* Always visible — GPS coordinates in the link (AC requirement) */}
      <a
        href={GOOGLE_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-sm text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Ouvrir dans Google Maps
        <span className="sr-only">(nouvelle fenêtre)</span>
      </a>
    </div>
  );
}
