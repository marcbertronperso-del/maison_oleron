import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description:
    "CGV de la location Maison Oléron à Saint-Denis-d'Oléron : modalités de réservation, politique d'annulation, arrivée 16h / départ 10h.",
};

export default function CgvPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* Dark header — white navbar text readable against dark bg on scroll=0 */}
      <div className="bg-foreground pb-12 pt-16 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl text-white sm:text-4xl">
            Conditions Générales de Vente
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="cgv-objet" className="scroll-mt-20">
          <h2
            id="cgv-objet"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            1. Objet
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Les présentes conditions générales régissent la location saisonnière
            de la Maison Oléron, située à Saint-Denis-d&apos;Oléron
            (17650&nbsp;— Charente-Maritime), pour un usage exclusivement
            touristique et privé.
          </p>
        </section>

        <section aria-labelledby="cgv-reservation" className="scroll-mt-20">
          <h2
            id="cgv-reservation"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            2. Réservation et acompte
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            La réservation est confirmée à réception d&apos;un acompte de 30&nbsp;%
            du montant total du séjour. Le solde est exigible au plus tard
            35&nbsp;jours avant la date d&apos;arrivée. À défaut de règlement du
            solde dans ce délai, le propriétaire se réserve le droit d&apos;annuler
            la réservation sans remboursement de l&apos;acompte.
          </p>
        </section>

        <section aria-labelledby="cgv-annulation" className="scroll-mt-20">
          <h2
            id="cgv-annulation"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            3. Politique d&apos;annulation
          </h2>
          <ul className="mt-4 space-y-4 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Annulation plus de 30&nbsp;jours avant l&apos;arrivée&nbsp;:
              </span>{" "}
              l&apos;acompte versé est définitivement acquis au propriétaire et
              ne sera pas remboursé.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Annulation moins de 30&nbsp;jours avant l&apos;arrivée&nbsp;:
              </span>{" "}
              la totalité du montant du séjour est due, que le séjour soit
              effectué ou non.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Il est vivement recommandé au locataire de souscrire une assurance
            annulation auprès de son assureur.
          </p>
        </section>

        <section aria-labelledby="cgv-arrivee" className="scroll-mt-20">
          <h2
            id="cgv-arrivee"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            4. Arrivée et départ
          </h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Arrivée&nbsp;:
              </span>{" "}
              à partir de 16&nbsp;h&nbsp;00
            </li>
            <li>
              <span className="font-medium text-foreground">
                Départ&nbsp;:
              </span>{" "}
              avant 10&nbsp;h&nbsp;00
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Tout départ tardif non convenu à l&apos;avance pourra donner lieu à
            une facturation complémentaire. Le logement devra être restitué dans
            l&apos;état de propreté dans lequel il a été remis.
          </p>
        </section>

        <section aria-labelledby="cgv-retractation" className="scroll-mt-20">
          <h2
            id="cgv-retractation"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            5. Absence de droit de rétractation
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Conformément à l&apos;article L221-28 du Code de la consommation,
            le droit de rétractation prévu à l&apos;article L221-18 ne
            s&apos;applique pas aux contrats portant sur la fourniture
            d&apos;hébergement touristique conclus pour une date ou une période
            déterminée.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            En procédant à la réservation, le locataire reconnaît avoir pris
            connaissance des présentes CGV et les accepte sans réserve.
          </p>
        </section>

        <section aria-labelledby="cgv-obligations" className="scroll-mt-20">
          <h2
            id="cgv-obligations"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            6. Obligations du locataire
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
            <li>
              La capacité maximale d&apos;accueil est de
              <strong className="font-semibold text-foreground">
                {" "}9&nbsp;personnes
              </strong>
              . Tout dépassement est strictement interdit.
            </li>
            <li>
              Le logement est mis à disposition à des fins exclusivement
              touristiques. La sous-location est interdite.
            </li>
            <li>
              Tout dommage causé au bien loué ou à son mobilier sera refacturé
              au locataire.
            </li>
          </ul>
        </section>

        <p className="border-t pt-8 text-xs text-muted-foreground">
          Pour toute question relative aux présentes CGV, contactez-nous à{" "}
          <a
            href="mailto:contact@maison-oleron.fr"
            className="text-primary hover:underline"
          >
            contact@maison-oleron.fr
          </a>
          .
        </p>
      </div>
    </main>
  );
}
