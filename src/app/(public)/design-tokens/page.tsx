const colorTokens = [
  { name: "primary", css: "--primary", label: "Terracotta — CTAs, bouton Réserver", textClass: "text-white" },
  { name: "primary-hover", css: "--primary-hover", label: "Hover / pressed", textClass: "text-white" },
  { name: "primary-text", css: "--primary-text", label: "Terracotta accessible (4.6:1 sur fond)", textClass: "text-white" },
  { name: "accent", css: "--accent", label: "Bleu mer — liens, badges", textClass: "text-white" },
  { name: "background", css: "--background", label: "Blanc sable — fond de page", textClass: "text-foreground" },
  { name: "card", css: "--card", label: "Cards, panneaux, modals", textClass: "text-foreground" },
  { name: "muted", css: "--muted", label: "Sable clair — sections alternées", textClass: "text-foreground" },
  { name: "foreground", css: "--foreground", label: "Brun chaud — texte principal", textClass: "text-white" },
  { name: "muted-foreground", css: "--muted-foreground", label: "Gris brun — texte secondaire", textClass: "text-white" },
  { name: "success", css: "--success", label: "Vert maquis — dates disponibles", textClass: "text-white" },
  { name: "destructive", css: "--destructive", label: "Rouge — erreurs, paiement refusé", textClass: "text-white" },
  { name: "unavailable", css: "--unavailable", label: "Gris sable — dates indisponibles", textClass: "text-foreground" },
  { name: "border", css: "--border", label: "Bordures, séparateurs", textClass: "text-foreground" },
];

const typographyTokens = [
  { label: "Display / Hero", font: "font-heading", size: "text-5xl", weight: "font-normal", sample: "Maison Oléron" },
  { label: "H1", font: "font-heading", size: "text-4xl", weight: "font-normal", sample: "Location sur l'Île d'Oléron" },
  { label: "H2 — Inter 600", font: "font-sans", size: "text-2xl", weight: "font-semibold", sample: "Équipements & Services" },
  { label: "H3 — Inter 600", font: "font-sans", size: "text-xl", weight: "font-semibold", sample: "3 chambres, 9 personnes" },
  { label: "Body — Inter 400", font: "font-sans", size: "text-base", weight: "font-normal", sample: "À 200 m de la plage, dans un jardin de 1 000 m², cette maison accueille jusqu'à 9 personnes." },
  { label: "Small — Inter 400", font: "font-sans", size: "text-sm", weight: "font-normal", sample: "Arrivée 16h · Départ 10h · Annulation > 30 jours" },
  { label: "Caption — Inter 500", font: "font-sans", size: "text-xs", weight: "font-medium", sample: "DISPONIBLE · 7 NUITS MIN" },
  { label: "CTA — Inter 600", font: "font-sans", size: "text-base", weight: "font-semibold", sample: "Réserver maintenant" },
];

export default function DesignTokensPage() {
  return (
    <div className="min-h-screen bg-background p-10">
      <h1 className="font-heading text-4xl text-foreground mb-2">Design Tokens</h1>
      <p className="text-muted-foreground text-sm mb-12">Référence visuelle — Maison Oléron</p>

      {/* Colors */}
      <section className="mb-16">
        <h2 className="font-sans text-2xl font-semibold text-foreground mb-6">Palette de couleurs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="rounded-lg overflow-hidden border border-border">
              <div
                className={`h-20 flex items-end px-4 pb-3 ${token.textClass}`}
                style={{ backgroundColor: `var(${token.css})` }}
              >
                <span className="text-xs font-mono opacity-80">{token.css}</span>
              </div>
              <div className="bg-card px-4 py-3">
                <p className="text-sm font-medium text-foreground font-mono">{token.css}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{token.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="font-sans text-2xl font-semibold text-foreground mb-6">Système typographique</h2>
        <div className="space-y-6">
          {typographyTokens.map((t) => (
            <div key={t.label} className="flex items-baseline gap-6 border-b border-border pb-6">
              <span className="text-xs text-muted-foreground font-mono w-40 shrink-0">{t.label}</span>
              <span className={`${t.font} ${t.size} ${t.weight} text-foreground leading-tight`}>
                {t.sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Ring / Focus */}
      <section className="mt-16">
        <h2 className="font-sans text-2xl font-semibold text-foreground mb-6">Focus & Ring</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Bouton primaire (focus me)
          </button>
          <button className="px-4 py-2 border border-border rounded-md text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Bouton secondaire (focus me)
          </button>
        </div>
      </section>
    </div>
  );
}
