import Link from "next/link";
import { desc, count } from "drizzle-orm";
import { db } from "~/server/db";
import { adminAuditLogs } from "~/server/db/schema";
import { cn } from "~/lib/utils";

export const metadata = { title: "Journal d'audit — Administration" };

const PAGE_SIZE = 25;

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_BLOCK: "bg-blue-100 text-blue-800",
  DELETE_BLOCK: "bg-red-100 text-red-700",
  UPDATE_PERIOD_PRICE: "bg-amber-100 text-amber-800",
  CREATE_PERIOD: "bg-green-100 text-green-800",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [countRows, logs] = await Promise.all([
    db.select({ total: count() }).from(adminAuditLogs),
    db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.performed_at))
      .limit(PAGE_SIZE)
      .offset(offset),
  ]);

  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl text-foreground">Journal d&apos;audit</h1>
        <span className="text-sm text-muted-foreground">
          {total} entrée{total !== 1 ? "s" : ""}
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucune entrée pour le moment.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les actions admin (blocages, tarifs) apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Entité
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTime(log.performed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700",
                      )}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground">{log.entity_type}</span>
                    {log.entity_id && (
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {log.entity_id.slice(0, 8)}…
                      </p>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    {log.details ? (
                      <pre className="truncate font-mono text-[10px] text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </pre>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?page=${page - 1}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                ← Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit?page=${page + 1}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Suivant →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
