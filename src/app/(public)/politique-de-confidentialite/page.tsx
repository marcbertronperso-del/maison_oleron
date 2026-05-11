import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description:
    "Politique de confidentialité de Maison Oléron : données collectées, finalités, durée de conservation et droits RGPD.",
};

export default function PolitiqueDeConfidentialitePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* Dark header — white navbar text readable against dark bg on scroll=0 */}
      <div className="bg-foreground pb-12 pt-16 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl text-white sm:text-4xl">
            Politique de Confidentialité
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="pc-responsable" className="scroll-mt-20">
          <h2
            id="pc-responsable"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            1. Responsable du traitement
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Le responsable du traitement des données personnelles collectées via
            ce site est le propriétaire de la Maison Oléron
            (contact&nbsp;:{" "}
            <a
              href="mailto:contact@maloloantiochas.fr"
              className="text-primary hover:underline"
            >
              contact@maloloantiochas.fr
            </a>
            ).
          </p>
        </section>

        <section aria-labelledby="pc-donnees" className="scroll-mt-20">
          <h2
            id="pc-donnees"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            2. Données collectées
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dans le cadre du processus de réservation, les données suivantes
            sont collectées&nbsp;:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Nom et prénom</li>
            <li>Adresse e-mail</li>
            <li>Numéro de téléphone</li>
            <li>
              Données de paiement (traitées directement par Stripe ou PayPal —
              non conservées sur nos serveurs)
            </li>
          </ul>
        </section>

        <section aria-labelledby="pc-finalite" className="scroll-mt-20">
          <h2
            id="pc-finalite"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            3. Finalité du traitement
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Les données collectées ont pour unique finalité la gestion des
            réservations de location saisonnière&nbsp;: confirmation, suivi,
            envoi des informations d&apos;accès et communications liées au
            séjour. Elles ne sont pas utilisées à des fins commerciales ni
            cédées à des tiers.
          </p>
        </section>

        <section aria-labelledby="pc-conservation" className="scroll-mt-20">
          <h2
            id="pc-conservation"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            4. Durée de conservation
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Les données personnelles sont conservées pendant une durée maximale
            de <strong className="font-semibold text-foreground">5 ans</strong>{" "}
            à compter de la fin du séjour, conformément aux obligations
            comptables et fiscales applicables.
          </p>
        </section>

        <section aria-labelledby="pc-droits" className="scroll-mt-20">
          <h2
            id="pc-droits"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            5. Vos droits (RGPD)
          </h2>
          <p className="mt-4 text-muted-foreground">
            Conformément au Règlement général sur la protection des données
            (UE) 2016/679, vous disposez des droits suivants&nbsp;:
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Droit d&apos;accès (art.&nbsp;15)&nbsp;:
              </span>{" "}
              obtenir la confirmation que des données vous concernant sont
              traitées et en recevoir une copie.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Droit de rectification (art.&nbsp;16)&nbsp;:
              </span>{" "}
              faire corriger des données inexactes ou incomplètes.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Droit à l&apos;effacement (art.&nbsp;17)&nbsp;:
              </span>{" "}
              demander la suppression de vos données, sauf obligation légale de
              conservation.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Droit d&apos;opposition (art.&nbsp;21)&nbsp;:
              </span>{" "}
              vous opposer au traitement de vos données pour des raisons tenant
              à votre situation particulière.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Pour exercer ces droits, adressez votre demande par e-mail à{" "}
            <a
              href="mailto:contact@maloloantiochas.fr"
              className="text-primary hover:underline"
            >
              contact@maloloantiochas.fr
            </a>
            . Vous disposez également du droit d&apos;introduire une
            réclamation auprès de la{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CNIL
              <span className="sr-only">(nouvelle fenêtre)</span>
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="pc-securite" className="scroll-mt-20">
          <h2
            id="pc-securite"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            6. Sécurité des données
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Les données sont hébergées sur des serveurs sécurisés (Vercel /
            Neon) situés dans l&apos;Union européenne ou offrant des garanties
            équivalentes. Les communications sont chiffrées via HTTPS.
          </p>
        </section>
      </div>
    </main>
  );
}
