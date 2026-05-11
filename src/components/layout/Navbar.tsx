"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { lockScroll, unlockScroll } from "~/lib/scroll-lock";

const NAV_LINKS = [
  { href: "/#maison", label: "La Maison" },
  { href: "/#galerie", label: "Galerie" },
  { href: "/acces", label: "Accès" },
  { href: "/#contact", label: "Contact" },
] as const;

const SCROLL_THRESHOLD = 200;

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevDrawerOpen = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape key
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Scroll lock
  useEffect(() => {
    if (!drawerOpen) return;
    lockScroll();
    return () => unlockScroll();
  }, [drawerOpen]);

  // inert + focus management
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (drawerOpen) {
      el.removeAttribute("inert");
      if (!prevDrawerOpen.current) {
        drawerCloseBtnRef.current?.focus();
      }
    } else {
      el.setAttribute("inert", "");
      if (prevDrawerOpen.current) {
        hamburgerRef.current?.focus();
      }
    }
    prevDrawerOpen.current = drawerOpen;
  }, [drawerOpen]);

  const close = () => setDrawerOpen(false);

  return (
    <>
      {/* Skip link — hidden above viewport, revealed on keyboard focus */}
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-200 -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none transition-transform focus-visible:translate-y-0"
      >
        Aller au contenu principal
      </a>

      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-[background-color] duration-200 ${
          !isHome || scrolled ? "bg-foreground" : "bg-transparent"
        }`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
          aria-label="Navigation principale"
        >
          <Link
            href="/"
            className="font-heading text-xl text-white transition-opacity hover:opacity-90"
          >
            Maison Oléron
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 md:flex" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/#disponibilites"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Réserver
              </Link>
            </li>
          </ul>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            className="text-white md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </nav>
      </header>

      {/* Mobile full-screen drawer — inert when closed (prevents focus entry + hides from AT) */}
      <div
        ref={drawerRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed inset-0 z-60 flex flex-col bg-foreground transition-opacity duration-200 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      >
        {/* Stop propagation so clicks inside the content don't close the drawer */}
        <div
          className="flex flex-1 flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <span className="font-heading text-xl text-white">Maison Oléron</span>
            <button
              ref={drawerCloseBtnRef}
              onClick={close}
              aria-label="Fermer le menu"
              className="text-white"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="flex flex-1 flex-col items-center justify-center gap-8"
            aria-label="Menu mobile"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl text-white/90 transition-colors hover:text-white"
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#disponibilites"
              className="mt-4 rounded-md bg-primary px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-hover"
              onClick={close}
            >
              Réserver
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
