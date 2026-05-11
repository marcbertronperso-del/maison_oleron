"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import * as Sentry from "@sentry/nextjs";
import { cn } from "~/lib/utils";
import { SlotHoldTimer } from "~/components/booking/SlotHoldTimer";

// ── Stripe singleton ──────────────────────────────────────────────────────────

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDateFR(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES_FR[m]!} ${iso.slice(0, 4)}`;
}

function formatEUR(cents: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(cents / 100) + " EUR"
  );
}

// ── Stripe error → French ────────────────────────────────────────────────────

type PaymentError = { main: string; detail?: string };

function stripeErrorToFrench(code?: string, declineCode?: string): PaymentError {
  const main = "Paiement refusé. Votre réservation n'a pas été confirmée.";
  const key = declineCode ?? code;
  const details: Record<string, string> = {
    insufficient_funds: "Fonds insuffisants.",
    expired_card: "Carte expirée.",
    incorrect_cvc: "Code de sécurité incorrect.",
    do_not_honor: "Paiement refusé par votre banque.",
    card_declined: "Carte refusée par votre banque.",
    processing_error: "Erreur de traitement. Veuillez réessayer.",
    lost_card: "Cette carte a été signalée perdue.",
    stolen_card: "Cette carte a été signalée volée.",
  };
  return { main, detail: key ? details[key] : undefined };
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Récapitulatif", "Coordonnées", "Paiement"] as const;

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

// ── Inner form (needs useStripe / useElements inside Elements) ────────────────

interface CheckoutFormProps {
  depositCents: number;
  slotHoldId: string;
  bookingId: string;
}

function CheckoutForm({ depositCents, slotHoldId, bookingId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reserver/${slotHoldId}/confirmation?bookingId=${bookingId}`,
      },
    });

    // confirmPayment only returns here if there was an error (redirect happens on success)
    if (error) {
      const errorCode = error.code;
      const declineCode = error.decline_code;
      Sentry.captureException(error, {
        extra: { paymentMethod: "stripe", errorCode, declineCode },
      });
      setPaymentError(stripeErrorToFrench(errorCode, declineCode));
    }
    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe PaymentElement — renders Apple/Google Pay at top when available, card below */}
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />

      {paymentError && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm"
        >
          <p className="font-medium text-destructive">{paymentError.main}</p>
          {paymentError.detail && (
            <p className="mt-1 text-destructive/80">{paymentError.detail}</p>
          )}
        </div>
      )}

      {/* Security notice */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true">🔒</span>
        Paiement sécurisé — aucune donnée bancaire stockée
        <span className="ml-auto font-medium text-foreground">
          Powered by Stripe
        </span>
      </p>

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-white",
          "transition-colors hover:bg-primary-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isProcessing && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          />
        )}
        {isProcessing
          ? "Traitement en cours…"
          : paymentError
            ? "Réessayer"
            : `Payer l'acompte — ${formatEUR(depositCents)}`}
      </button>
    </form>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

// ── PayPal button section ─────────────────────────────────────────────────────

interface PayPalSectionProps {
  slotHoldId: string;
  paypalClientId: string;
  depositCents: number;
}

function PayPalSection({ slotHoldId, paypalClientId, depositCents: _depositCents }: PayPalSectionProps) {
  const router = useRouter();
  const [paypalError, setPaypalError] = useState<string | null>(null);

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "EUR",
        intent: "capture",
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">ou payer avec</span>
          <div className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>

        <PayPalButtons
          style={{ layout: "horizontal", height: 44 }}
          createOrder={async () => {
            setPaypalError(null);
            const res = await fetch("/api/bookings/create-paypal-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slotHoldId }),
            });
            if (!res.ok) {
              const json = await res.json() as { error?: string };
              throw new Error(json.error ?? "PayPal order creation failed");
            }
            const json = await res.json() as { data: { orderId: string } };
            return json.data.orderId;
          }}
          onApprove={async (data) => {
            const raw = sessionStorage.getItem("booking_tenant");
            if (!raw) {
              setPaypalError("Informations manquantes. Veuillez recommencer depuis l'étape 2.");
              return;
            }
            const tenantInfo = JSON.parse(raw) as {
              tenantName: string;
              tenantEmail: string;
              tenantPhone: string;
            };

            const res = await fetch("/api/bookings/initiate-payment-paypal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderID,
                slotHoldId,
                ...tenantInfo,
              }),
            });
            if (!res.ok) {
              const json = await res.json() as { error?: string };
              setPaypalError(json.error ?? "Une erreur PayPal est survenue.");
              return;
            }
            const json = await res.json() as { data: { bookingId: string } };
            router.push(
              `/reserver/${slotHoldId}/confirmation?bookingId=${json.data.bookingId}&provider=paypal`,
            );
          }}
          onError={(err) => {
            Sentry.captureException(
              err instanceof Error ? err : new Error("PayPal payment error"),
              { extra: { paymentMethod: "paypal" } },
            );
            setPaypalError("Le paiement PayPal a échoué. Veuillez réessayer.");
          }}
        />

        {paypalError && (
          <p role="alert" className="text-xs text-destructive">
            {paypalError}
          </p>
        )}
      </div>
    </PayPalScriptProvider>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TunnelPaiementFormProps {
  slotHoldId: string;
  arrivalDate: string;
  departureDate: string;
  expiresAt: string;
  depositCents: number;
  paypalClientId: string;
}

export function TunnelPaiementForm({
  slotHoldId,
  arrivalDate,
  departureDate,
  expiresAt,
  depositCents,
  paypalClientId,
}: TunnelPaiementFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const initPayment = useCallback(async () => {
    const raw = sessionStorage.getItem("booking_tenant");
    if (!raw) {
      setInitError("Informations manquantes. Veuillez recommencer depuis l'étape 2.");
      return;
    }

    let tenantInfo: { tenantName: string; tenantEmail: string; tenantPhone: string };
    try {
      tenantInfo = JSON.parse(raw) as typeof tenantInfo;
    } catch {
      setInitError("Informations corrompues. Veuillez recommencer depuis l'étape 2.");
      return;
    }

    try {
      const res = await fetch("/api/bookings/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotHoldId, ...tenantInfo }),
      });

      if (res.status === 410) {
        setInitError("Votre créneau a expiré. Veuillez choisir de nouvelles dates.");
        return;
      }
      if (!res.ok) {
        setInitError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      const json = await res.json() as {
        data: { clientSecret: string; bookingId: string };
      };
      setClientSecret(json.data.clientSecret);
      setBookingId(json.data.bookingId);
    } catch {
      setInitError("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  }, [slotHoldId]);

  useEffect(() => {
    void initPayment();
  }, [initPayment]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

        {/* Step indicator */}
        <StepIndicator currentStep={3} />

        {/* Timer */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Créneau réservé</span>
          <SlotHoldTimer slotHoldId={slotHoldId} expiresAt={expiresAt} />
        </div>

        <h1 className="mt-8 font-heading text-2xl text-foreground">
          Paiement de l&apos;acompte
        </h1>

        {/* Booking summary */}
        <div className="mt-4 space-y-1 rounded-lg bg-muted px-4 py-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {formatDateFR(arrivalDate)} → {formatDateFR(departureDate)}
            </span>
            <span className="font-semibold text-foreground">
              Acompte : {formatEUR(depositCents)}
            </span>
          </div>
        </div>

        {/* Payment form */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          {initError ? (
            <div className="space-y-4">
              <p role="alert" className="text-sm text-destructive">
                {initError}
              </p>
              <Link
                href={`/reserver/${slotHoldId}/coordonnees`}
                className="text-sm text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                ← Retour à l&apos;étape 2
              </Link>
            </div>
          ) : !clientSecret || !bookingId ? (
            <div className="flex items-center justify-center py-8">
              <span
                aria-label="Chargement du formulaire de paiement"
                className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
              />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
                locale: "fr",
              }}
            >
              <CheckoutForm
                depositCents={depositCents}
                slotHoldId={slotHoldId}
                bookingId={bookingId}
              />
            </Elements>
          )}
        </div>

        {/* PayPal alternative */}
        {!initError && clientSecret && (
          <div className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <PayPalSection
              slotHoldId={slotHoldId}
              paypalClientId={paypalClientId}
              depositCents={depositCents}
            />
          </div>
        )}

        {/* Back link */}
        <div className="mt-4">
          <Link
            href={`/reserver/${slotHoldId}/coordonnees`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Retour aux coordonnées
          </Link>
        </div>

      </div>
    </main>
  );
}
