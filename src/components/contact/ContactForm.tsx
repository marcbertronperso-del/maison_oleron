"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Field = "nom" | "prenom" | "email" | "telephone" | "message" | "captchaAnswer";

interface FormState {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
  captchaAnswer: string;
}

interface CaptchaChallenge {
  question: string;
  token: string;
}

const EMPTY: FormState = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  message: "",
  captchaAnswer: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const firstErrorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    void fetchCaptcha();
  }, []);

  async function fetchCaptcha() {
    try {
      const res = await fetch("/api/contact/captcha");
      const data = (await res.json()) as CaptchaChallenge;
      setCaptcha(data);
      setForm((f) => ({ ...f, captchaAnswer: "" }));
    } catch {
      // silently retry on next submit
    }
  }

  function set(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): Partial<Record<Field, string>> {
    const e: Partial<Record<Field, string>> = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.prenom.trim()) e.prenom = "Le prénom est requis.";
    if (!form.email.trim()) e.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Adresse email invalide.";
    if (form.message.trim().length < 10) e.message = "Le message doit contenir au moins 10 caractères.";
    if (!form.captchaAnswer.trim()) e.captchaAnswer = "Veuillez répondre à la question.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!captcha) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          captchaToken: captcha.token,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setForm(EMPTY);
        void fetchCaptcha();
      } else {
        const body = (await res.json()) as { error?: string };
        if (body.error === "CAPTCHA_INVALID") {
          setErrors({ captchaAnswer: "Réponse incorrecte, veuillez réessayer." });
          void fetchCaptcha();
          setStatus("idle");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-2xl" aria-hidden="true">✓</p>
        <p className="mt-2 font-medium text-foreground">Message envoyé !</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nous vous répondrons dans les plus brefs délais.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-primary underline-offset-2 hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Prénom */}
        <div>
          <label htmlFor="cf-prenom" className="mb-1.5 block text-sm font-medium text-foreground">
            Prénom <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="cf-prenom"
            type="text"
            autoComplete="given-name"
            value={form.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            aria-invalid={!!errors.prenom}
            aria-describedby={errors.prenom ? "cf-prenom-err" : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
          />
          {errors.prenom && (
            <p id="cf-prenom-err" role="alert" className="mt-1 text-xs text-destructive">
              {errors.prenom}
            </p>
          )}
        </div>

        {/* Nom */}
        <div>
          <label htmlFor="cf-nom" className="mb-1.5 block text-sm font-medium text-foreground">
            Nom <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="cf-nom"
            type="text"
            autoComplete="family-name"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            aria-invalid={!!errors.nom}
            aria-describedby={errors.nom ? "cf-nom-err" : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
          />
          {errors.nom && (
            <p id="cf-nom-err" role="alert" className="mt-1 text-xs text-destructive">
              {errors.nom}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-sm font-medium text-foreground">
            Adresse email <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="cf-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
          />
          {errors.email && (
            <p id="cf-email-err" role="alert" className="mt-1 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="cf-tel" className="mb-1.5 block text-sm font-medium text-foreground">
            Téléphone <span className="text-xs text-muted-foreground">(facultatif)</span>
          </label>
          <input
            id="cf-tel"
            type="tel"
            autoComplete="tel"
            value={form.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="cf-message" className="mb-1.5 block text-sm font-medium text-foreground">
            Message <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <textarea
            id="cf-message"
            rows={5}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "cf-message-err" : undefined}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive"
          />
          {errors.message && (
            <p id="cf-message-err" role="alert" className="mt-1 text-xs text-destructive">
              {errors.message}
            </p>
          )}
        </div>

        {/* CAPTCHA */}
        <div className="sm:col-span-2">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="mb-2 text-sm font-medium text-foreground">
              Vérification anti-spam
            </p>
            <label htmlFor="cf-captcha" className="mb-1.5 block text-sm text-muted-foreground">
              {captcha ? captcha.question : "Chargement…"}
            </label>
            <input
              id="cf-captcha"
              type="text"
              inputMode="numeric"
              value={form.captchaAnswer}
              onChange={(e) => set("captchaAnswer", e.target.value)}
              aria-invalid={!!errors.captchaAnswer}
              aria-describedby={errors.captchaAnswer ? "cf-captcha-err" : undefined}
              disabled={!captcha}
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive disabled:opacity-50"
            />
            {errors.captchaAnswer && (
              <p id="cf-captcha-err" role="alert" className="mt-1 text-xs text-destructive">
                {errors.captchaAnswer}
              </p>
            )}
          </div>
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        <span aria-hidden="true" className="text-destructive">*</span> Champs obligatoires
      </p>

      <button
        type="submit"
        disabled={status === "sending" || !captcha}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {status === "sending" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
