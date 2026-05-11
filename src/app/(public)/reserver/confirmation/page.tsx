import Link from "next/link";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Demande envoyée — Maison Oléron",
};

export default function ConfirmationPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 font-heading text-2xl text-foreground sm:text-3xl">
          Demande envoyée !
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          Vous allez recevoir un email récapitulatif avec le détail de votre séjour
          et le montant de l&apos;acompte à régler.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-left">
          <p className="text-sm font-medium text-amber-800">
            ⚠ Confirmez votre réservation dans les 48 heures
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Sans versement de l&apos;acompte dans ce délai, le créneau sera
            automatiquement libéré.
          </p>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Pour toute question, répondez directement à l&apos;email que vous avez reçu.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
