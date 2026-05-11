"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { lockScroll, unlockScroll } from "~/lib/scroll-lock";

export interface Photo {
  src: string;
  alt: string;
}

interface GaleriePhotosProps {
  photos: readonly Photo[];
}

export function GaleriePhotos({ photos }: GaleriePhotosProps) {
  // ── Lightbox ───────────────────────────────────────────────────────────────
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const prevLightboxOpen = useRef(false);

  const openLightbox = (index: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setLightboxIndex(index);
  };
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const prevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);
  const nextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    const isNowOpen = lightboxIndex !== null;
    if (isNowOpen && !prevLightboxOpen.current) closeBtnRef.current?.focus();
    prevLightboxOpen.current = isNowOpen;
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "ArrowRight") nextPhoto();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const dialog = lightboxRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    lockScroll();
    return () => unlockScroll();
  }, [lightboxIndex]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    e.preventDefault();
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (dx < -50) nextPhoto();
    else if (dx > 50) prevPhoto();
  };

  // ── Carousel ───────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(photos.length > 1);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  function scrollPrev() {
    scrollRef.current?.scrollBy({ left: -(scrollRef.current.clientWidth * 0.8), behavior: "smooth" });
  }
  function scrollNext() {
    scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth * 0.8, behavior: "smooth" });
  }

  if (photos.length === 0) return null;

  return (
    <>
      {/* ── Carousel ── */}
      <div className="relative">
        {/* Prev arrow */}
        {canPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Photos précédentes"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white shadow transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        )}

        {/* Next arrow */}
        {canNext && (
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Photos suivantes"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white shadow transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={(e) => openLightbox(i, e.currentTarget)}
              aria-label={`Ouvrir "${photo.alt}" en plein écran`}
              className="relative h-72 w-72 shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-80 sm:w-80 lg:h-96 lg:w-96"
              style={{ scrollSnapAlign: "start" }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 320px, 288px"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-6">
                <p className="truncate text-center text-sm font-medium text-white">
                  {photo.alt}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie photos"
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
        >
          <p
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-sm text-white/80"
          >
            {lightboxIndex + 1}&nbsp;/&nbsp;{photos.length}
          </p>

          <button
            ref={closeBtnRef}
            type="button"
            className="absolute right-4 top-4 z-10 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={closeLightbox}
            aria-label="Fermer la galerie"
          >
            <X className="h-8 w-8" aria-hidden="true" />
          </button>

          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative h-[82vh] w-[90vw]">
              <Image
                src={photos[lightboxIndex]!.src}
                alt={photos[lightboxIndex]!.alt}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            <p className="mt-3 text-sm font-medium text-white/90">
              {photos[lightboxIndex]!.alt}
            </p>
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-10 w-10" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-10 w-10" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
