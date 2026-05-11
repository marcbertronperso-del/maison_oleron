"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "~/components/ui/button";

export interface SlotHoldTimerProps {
  slotHoldId: string;
  expiresAt: string; // ISO 8601
  onExpired?: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function timerColorClass(seconds: number): string {
  if (seconds > 480) return "text-green-600 dark:text-green-400";
  if (seconds > 240) return "text-orange-500";
  return "text-red-600 dark:text-red-400";
}

export function SlotHoldTimer({
  slotHoldId,
  expiresAt,
  onExpired,
}: SlotHoldTimerProps) {
  const expiryMs = useRef(new Date(expiresAt).getTime());

  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((expiryMs.current - Date.now()) / 1000)),
  );
  const [isExpired, setIsExpired] = useState(
    () => Math.max(0, Math.ceil((expiryMs.current - Date.now()) / 1000)) <= 0,
  );
  const [liveText, setLiveText] = useState("");
  const prevSecondsRef = useRef(secondsLeft);

  useEffect(() => {
    if (isExpired) return;

    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((expiryMs.current - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);

      // Announce each time a full-minute mark is crossed
      const prevMins = Math.floor(prevSecondsRef.current / 60);
      const currMins = Math.floor(remaining / 60);
      if (currMins < prevMins && remaining > 0) {
        setLiveText(
          `${currMins} minute${currMins > 1 ? "s" : ""} restante${currMins > 1 ? "s" : ""}`,
        );
      }
      prevSecondsRef.current = remaining;

      if (remaining <= 0) setIsExpired(true);
    }, 1000);

    return () => clearInterval(id);
  }, [isExpired]);

  async function handleRetour() {
    try {
      await fetch(`/api/bookings/slot-hold/${slotHoldId}`, {
        method: "DELETE",
      });
    } catch {
      // best-effort — hold will expire naturally
    }
    onExpired?.();
    window.location.href = "#disponibilites";
  }

  const minutesLeft = Math.ceil(secondsLeft / 60);

  return (
    <>
      {/* Screen-reader live region: announces at each full minute */}
      <span role="status" aria-live="polite" className="sr-only">
        {liveText}
      </span>

      <div
        role="timer"
        aria-label={`Temps restant pour confirmer votre réservation : ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`}
        className={`flex items-center gap-2 font-mono text-lg font-semibold tabular-nums ${timerColorClass(secondsLeft)}`}
      >
        <span aria-hidden="true">⏱</span>
        <span aria-hidden="true">{formatTime(secondsLeft)}</span>
      </div>

      {/* Blocking expiry dialog — cannot be dismissed */}
      <Dialog.Root open={isExpired}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-xl outline-none"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <Dialog.Title className="font-heading text-xl text-foreground">
              Votre créneau a expiré
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Le délai de 15 minutes pour confirmer votre réservation est
              écoulé. Votre créneau a été libéré.
            </Dialog.Description>
            <div className="mt-6">
              <Button onClick={handleRetour} className="w-full">
                Retour au calendrier
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
