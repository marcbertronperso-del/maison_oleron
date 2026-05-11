import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-foreground py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-sm md:flex-row md:justify-between">
          <p className="text-white/50">
            © {new Date().getFullYear()} Maison Oléron — Saint-Denis-d&apos;Oléron
          </p>
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
            aria-label="Liens légaux"
          >
            <Link
              href="/cgv"
              className="text-white/70 transition-colors hover:text-white"
            >
              CGV
            </Link>
            <Link
              href="/mentions-legales"
              className="text-white/70 transition-colors hover:text-white"
            >
              Mentions légales
            </Link>
            <Link
              href="/politique-de-confidentialite"
              className="text-white/70 transition-colors hover:text-white"
            >
              Politique de confidentialité
            </Link>
            <a
              href="mailto:contact@maloloantiochas.fr"
              className="text-white/70 transition-colors hover:text-white"
            >
              contact@maloloantiochas.fr
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
