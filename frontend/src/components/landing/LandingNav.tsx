"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Tech Stack", href: "#tech-stack" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-sentinel");
    if (!sentinel) {
      // Fallback to scroll listener
      const onScroll = () => setScrolled(window.scrollY > 80);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src={scrolled ? "/Medbridge_logo_Color_RGB.svg" : "/Medbridge_logo_White_RGB.svg"}
            alt="MedBridge"
            className="h-8 transition-all duration-300"
          />
        </Link>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 hover:opacity-100 ${
                scrolled
                  ? "text-text/70 hover:text-text"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right — Sign In + Mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className={`hidden md:inline-flex text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 ${
              scrolled
                ? "bg-secondary text-primary hover:bg-accent"
                : "border border-white/30 text-white hover:bg-white/10"
            }`}
          >
            Sign In
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-text hover:bg-surface-alt" : "text-white hover:bg-white/10"
            }`}
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-80 border-b border-border" : "max-h-0"
        } ${scrolled ? "bg-white" : "bg-primary-dark/95 backdrop-blur-md"}`}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                scrolled ? "text-text/70 hover:text-text" : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-secondary text-primary text-center hover:bg-accent transition-colors mt-2"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
