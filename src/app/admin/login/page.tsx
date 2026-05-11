import { LoginForm } from "./_login-form";

export const metadata = { title: "Administration — Connexion" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 font-heading text-xl text-foreground">
          Administration
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Maison Oléron
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
