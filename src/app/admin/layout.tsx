import Link from "next/link";
import { auth } from "~/server/auth";
import { adminSignOut } from "./_actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/calendrier", label: "Calendrier" },
  { href: "/admin/blocages", label: "Blocages" },
  { href: "/admin/tarifs", label: "Tarifs" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/audit", label: "Journal d'audit" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        {/* Brand */}
        <div className="border-b border-border px-5 py-4">
          <p className="font-heading text-sm font-semibold text-foreground">
            Maison Oléron
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Administration</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer: user + sign out */}
        <div className="border-t border-border px-3 py-3">
          <p className="truncate px-3 text-xs text-muted-foreground">
            {session?.user?.email}
          </p>
          <form action={adminSignOut} className="mt-1">
            <button
              type="submit"
              className="flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
