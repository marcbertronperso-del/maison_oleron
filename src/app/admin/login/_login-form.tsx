"use client";

import { useActionState } from "react";
import { cn } from "~/lib/utils";
import { login } from "./actions";

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={cn(
            "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          )}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={cn(
            "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          )}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white",
          "transition-colors hover:bg-primary-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
          />
        )}
        {isPending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
