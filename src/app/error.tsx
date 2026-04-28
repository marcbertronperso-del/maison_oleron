"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Erreur</h1>
      <p className="mt-2 text-muted-foreground">Une erreur est survenue.</p>
      <button onClick={reset} className="mt-4 underline">
        Réessayer
      </button>
    </main>
  );
}
