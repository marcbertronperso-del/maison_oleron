"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { SlotHoldTimer } from "~/components/booking/SlotHoldTimer";

// ── Schema ────────────────────────────────────────────────────────────────────

const CoordonneesSchema = z.object({
  nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit comporter au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  telephone: z
    .string()
    .regex(/^\d{10}$/, "Le numéro doit comporter exactement 10 chiffres"),
  accepteCGV: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions" }),
  }),
  accepteRGPD: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter le traitement des données" }),
  }),
});

type CoordonneesData = z.infer<typeof CoordonneesSchema>;

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Récapitulatif", "Coordonnées", "Confirmation"] as const;

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Étapes de réservation">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isActive = num === currentStep;
          return (
            <li key={label} className="flex items-start">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {num}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="mx-2 mt-4 h-px w-12 shrink-0 bg-border sm:w-20"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TunnelCoordonneesFormProps {
  slotHoldId: string;
  arrivalDate: string;
  departureDate: string;
  expiresAt: string;
}

export function TunnelCoordonneesForm({
  slotHoldId,
  arrivalDate,
  departureDate,
  expiresAt,
}: TunnelCoordonneesFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CoordonneesData>({
    resolver: zodResolver(CoordonneesSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: CoordonneesData) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivalDate,
          departureDate,
          tenantName: `${data.prenom} ${data.nom}`,
          tenantEmail: data.email,
          tenantPhone: data.telephone,
          excludeHoldId: slotHoldId,
        }),
      });

      if (res.status === 409) {
        setSubmitError(
          "Ce créneau n'est plus disponible. Veuillez choisir d'autres dates.",
        );
        return;
      }
      if (!res.ok) {
        setSubmitError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      router.push(`/reserver/confirmation`);
    } catch {
      setSubmitError("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground",
      "placeholder:text-muted-foreground",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
      hasError ? "border-destructive" : "border-border",
    );

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

        {/* Step indicator */}
        <StepIndicator currentStep={2} />

        {/* Timer */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Créneau réservé</span>
          <SlotHoldTimer slotHoldId={slotHoldId} expiresAt={expiresAt} />
        </div>

        <h1 className="mt-8 font-heading text-2xl text-foreground">
          Conditions &amp; Coordonnées
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 space-y-8"
        >
          {/* ── Cancellation policy ─────────────────────────────── */}
          <section
            aria-labelledby="annulation-heading"
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2
              id="annulation-heading"
              className="font-heading text-lg text-foreground"
            >
              Conditions d&apos;annulation
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">&gt; 30 jours</span>{" "}
                avant l&apos;arrivée : acompte conservé
              </li>
              <li>
                <span className="font-medium text-foreground">&lt; 30 jours</span>{" "}
                avant l&apos;arrivée : solde total dû
              </li>
            </ul>
          </section>

          {/* ── Checkboxes ──────────────────────────────────────── */}
          <section
            aria-labelledby="acceptation-heading"
            className="space-y-3"
          >
            <h2
              id="acceptation-heading"
              className="font-heading text-lg text-foreground"
            >
              Acceptation
            </h2>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                {...register("accepteCGV")}
                aria-describedby={errors.accepteCGV ? "cgv-error" : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                J&apos;ai lu et j&apos;accepte les conditions d&apos;annulation et les{" "}
                <a
                  href="/cgv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  CGV
                </a>
              </span>
            </label>
            {errors.accepteCGV && (
              <p id="cgv-error" role="alert" className="text-xs text-destructive">
                {errors.accepteCGV.message}
              </p>
            )}

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                {...register("accepteRGPD")}
                aria-describedby={errors.accepteRGPD ? "rgpd-error" : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                J&apos;accepte que mes données personnelles soient traitées pour
                finaliser ma réservation (RGPD)
              </span>
            </label>
            {errors.accepteRGPD && (
              <p id="rgpd-error" role="alert" className="text-xs text-destructive">
                {errors.accepteRGPD.message}
              </p>
            )}
          </section>

          {/* ── Contact fields ───────────────────────────────────── */}
          <section aria-labelledby="coordonnees-heading" className="space-y-4">
            <h2
              id="coordonnees-heading"
              className="font-heading text-lg text-foreground"
            >
              Vos coordonnées
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="prenom" label="Prénom" error={errors.prenom?.message}>
                <input
                  id="prenom"
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.prenom}
                  aria-describedby={errors.prenom ? "prenom-error" : undefined}
                  {...register("prenom")}
                  className={inputClass(!!errors.prenom)}
                />
              </Field>

              <Field id="nom" label="Nom" error={errors.nom?.message}>
                <input
                  id="nom"
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={!!errors.nom}
                  aria-describedby={errors.nom ? "nom-error" : undefined}
                  {...register("nom")}
                  className={inputClass(!!errors.nom)}
                />
              </Field>
            </div>

            <Field id="email" label="Adresse e-mail" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className={inputClass(!!errors.email)}
              />
            </Field>

            <Field
              id="telephone"
              label="Téléphone (10 chiffres)"
              error={errors.telephone?.message}
            >
              <input
                id="telephone"
                type="tel"
                autoComplete="tel"
                placeholder="0612345678"
                aria-invalid={!!errors.telephone}
                aria-describedby={
                  errors.telephone ? "telephone-error" : undefined
                }
                {...register("telephone")}
                className={inputClass(!!errors.telephone)}
              />
            </Field>
          </section>

          {/* ── Submit error ─────────────────────────────────────── */}
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          {/* ── Actions ──────────────────────────────────────────── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link
              href={`/reserver/${slotHoldId}`}
              className="flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              ← Retour
            </Link>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-white",
                "transition-colors hover:bg-primary-hover",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande de réservation"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
