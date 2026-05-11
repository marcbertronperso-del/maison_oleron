import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales",
  description:
    "Mentions légales du site Maison Oléron : éditeur, hébergeur, et informations de contact.",
};

export default function MentionsLegalesPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* Dark header — white navbar text readable against dark bg on scroll=0 */}
      <div className="bg-foreground pb-12 pt-16 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl text-white sm:text-4xl">
            Mentions Légales
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="ml-editeur" className="scroll-mt-20">
          <h2
            id="ml-editeur"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            Éditeur du site
          </h2>
          <dl className="mt-4 space-y-2 text-muted-foreground">
            <div>
              <dt className="inline font-medium text-foreground">
                Nom&nbsp;:{" "}
              </dt>
              <dd className="inline">
                [Prénom Nom du propriétaire — à renseigner]
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Adresse&nbsp;:{" "}
              </dt>
              <dd className="inline">
                [Adresse du propriétaire — à renseigner]
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Contact&nbsp;:{" "}
              </dt>
              <dd className="inline">
                <a
                  href="mailto:contact@maloloantiochas.fr"
                  className="text-primary hover:underline"
                >
                  contact@maloloantiochas.fr
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Statut&nbsp;:{" "}
              </dt>
              <dd className="inline">Particulier</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="ml-hebergeur" className="scroll-mt-20">
          <h2
            id="ml-hebergeur"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            Hébergeur
          </h2>
          <dl className="mt-4 space-y-2 text-muted-foreground">
            <div>
              <dt className="inline font-medium text-foreground">
                Raison sociale&nbsp;:{" "}
              </dt>
              <dd className="inline">Vercel Inc.</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Adresse&nbsp;:{" "}
              </dt>
              <dd className="inline">
                340 Pine Street, Suite 701, San Francisco, CA&nbsp;94104,
                États-Unis
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Site&nbsp;:{" "}
              </dt>
              <dd className="inline">
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  vercel.com
                  <span className="sr-only">(nouvelle fenêtre)</span>
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="ml-propriete" className="scroll-mt-20">
          <h2
            id="ml-propriete"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            Propriété intellectuelle
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            L&apos;ensemble des contenus présents sur ce site (textes,
            photographies, éléments graphiques) est la propriété exclusive du
            propriétaire et est protégé par les lois relatives au droit
            d&apos;auteur. Toute reproduction, même partielle, est interdite
            sans autorisation préalable.
          </p>
        </section>

        <section aria-labelledby="ml-cookies" className="scroll-mt-20">
          <h2
            id="ml-cookies"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            Cookies
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Ce site n&apos;utilise pas de cookies publicitaires ou de traçage
            tiers. Des cookies techniques strictement nécessaires au
            fonctionnement du site (session de réservation) peuvent être
            déposés.
          </p>
        </section>
      </div>
    </main>
  );
}
