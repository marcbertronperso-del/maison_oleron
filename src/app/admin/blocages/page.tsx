import { desc } from "drizzle-orm";
import { db } from "~/server/db";
import { availabilityBlocks } from "~/server/db/schema";
import { createBlock, deleteBlock } from "./actions";

export const metadata = { title: "Blocages — Administration" };

// ── Formatters ────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatDateFR(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES_FR[m]!} ${iso.slice(0, 4)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlocagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; deleted?: string }>;
}) {
  const { error, success, deleted } = await searchParams;

  const blocks = await db
    .select()
    .from(availabilityBlocks)
    .orderBy(desc(availabilityBlocks.start_date));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-xl text-foreground">Blocages de dates</h1>

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
          Blocage ajouté avec succès.
        </div>
      )}
      {deleted && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          Blocage supprimé.
        </div>
      )}

      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Nouveau blocage
        </h2>
        <form action={createBlock} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-foreground"
              >
                Date de début
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-foreground"
              >
                Date de fin
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-foreground"
            >
              Raison{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="reason"
              name="reason"
              type="text"
              maxLength={255}
              placeholder="Travaux, usage personnel…"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Bloquer ce créneau
          </button>
        </form>
      </div>

      {/* Existing blocks list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Blocages existants ({blocks.length})
        </h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun blocage.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateFR(b.start_date)}
                    {b.start_date !== b.end_date && (
                      <> → {formatDateFR(b.end_date)}</>
                    )}
                  </p>
                  {b.reason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.reason}
                    </p>
                  )}
                </div>
                <form action={deleteBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
