import { asc } from "drizzle-orm";
import { db } from "~/server/db";
import { pricingPeriods } from "~/server/db/schema";
import { createPeriod, updatePeriodPrice } from "./actions";

export const metadata = { title: "Tarifs — Administration" };

const MONTH_NAMES_FR = [
  "", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.",
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: MONTH_NAMES_FR[i + 1]!,
}));

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function monthRange(start: number, end: number): string {
  if (start === end) return MONTH_NAMES_FR[start]!;
  return `${MONTH_NAMES_FR[start]!} – ${MONTH_NAMES_FR[end]!}`;
}

const INPUT_CLS =
  "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export default async function TarifsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  const periods = await db
    .select()
    .from(pricingPeriods)
    .orderBy(asc(pricingPeriods.start_month));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-heading text-xl text-foreground">Tarifs par période</h1>

      {/* Feedback banners */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {decodeURIComponent(success)}
        </div>
      )}

      {/* Existing periods */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Périodes existantes
        </h2>

        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune période. Ajoutez-en une ci-dessous.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {periods.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3"
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {monthRange(p.start_month, p.end_month)} — actuellement{" "}
                    <strong>{formatEUR(p.price_per_night)}</strong> / nuit
                  </p>
                </div>

                {/* Inline price update form */}
                <form action={updatePeriodPrice} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <div className="flex items-center gap-1">
                    <input
                      name="priceEur"
                      type="number"
                      min={1}
                      max={100000}
                      defaultValue={Math.round(p.price_per_night / 100)}
                      required
                      aria-label={`Prix / nuit pour ${p.name}`}
                      className={`w-24 ${INPUT_CLS}`}
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Sauvegarder
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new period */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ajouter une période
        </h2>
        <form action={createPeriod} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Nom de la période
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={255}
              placeholder="Ex : Mi-saison"
              className={`mt-1.5 w-full ${INPUT_CLS}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="startMonth" className="block text-sm font-medium text-foreground">
                Mois de début
              </label>
              <select id="startMonth" name="startMonth" required className={`mt-1.5 w-full ${INPUT_CLS}`}>
                {MONTH_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="endMonth" className="block text-sm font-medium text-foreground">
                Mois de fin
              </label>
              <select id="endMonth" name="endMonth" required className={`mt-1.5 w-full ${INPUT_CLS}`}>
                {MONTH_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priceEur" className="block text-sm font-medium text-foreground">
                Prix / nuit (€)
              </label>
              <input
                id="priceEur"
                name="priceEur"
                type="number"
                min={1}
                max={100000}
                required
                placeholder="120"
                className={`mt-1.5 w-full ${INPUT_CLS}`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ajouter la période
          </button>
        </form>
      </div>

      {/* Info note */}
      <p className="text-xs text-muted-foreground">
        Note : les prix sont stockés en base de données. La fonction de calcul{" "}
        <code className="rounded bg-muted px-1 py-0.5">getPricePerNight</code> doit être
        mise à jour pour lire ces valeurs dynamiquement.
      </p>
    </div>
  );
}
