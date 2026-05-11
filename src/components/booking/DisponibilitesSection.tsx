"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendrierDisponibilites } from "~/components/calendrier/CalendrierDisponibilites";
import { PanneauReservation } from "~/components/booking/PanneauReservation";

export function DisponibilitesSection() {
  const router = useRouter();
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  async function handleBook() {
    if (!selectedStart || !selectedEnd) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/bookings/slot-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivalDate: selectedStart,
          departureDate: selectedEnd,
        }),
      });
      if (res.status === 409) {
        setBookingError("Ce créneau vient d'être réservé. Veuillez choisir d'autres dates.");
        return;
      }
      if (!res.ok) {
        setBookingError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }
      const json = await res.json() as { data: { slotHoldId: string } };
      router.push(`/reserver/${json.data.slotHoldId}`);
    } catch {
      setBookingError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    // pb-24 reserves space for the fixed mobile bottom sheet
    <div className="pb-24 lg:flex lg:items-start lg:gap-8 lg:pb-0">
      <div className="min-w-0 flex-1">
        <CalendrierDisponibilites
          onSelectionChange={(start, end) => {
            setSelectedStart(start);
            setSelectedEnd(end);
            setBookingError(null);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <PanneauReservation
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          onBook={handleBook}
          isBooking={isBooking}
        />
        {bookingError && (
          <p role="alert" className="text-sm text-destructive lg:max-w-96">
            {bookingError}
          </p>
        )}
      </div>
    </div>
  );
}
