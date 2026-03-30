"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const RemotionPlayer = dynamic(() => import("./VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-primary-dark/50 animate-pulse rounded-xl" />
  ),
});

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-primary overflow-hidden">
      {/* Sentinel for nav background detection */}
      <div id="hero-sentinel" className="absolute top-0 left-0 w-full h-1" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Gradient mesh */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-secondary/5 blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px] animate-[float_15s_ease-in-out_infinite_reverse]" />

        {/* Geometric shapes */}
        <div className="absolute top-[15%] left-[10%] w-24 h-24 border border-white/[0.06] rounded-2xl rotate-12 animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute top-[25%] right-[15%] w-16 h-16 border border-secondary/[0.1] rounded-full animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[30%] left-[20%] w-20 h-20 border border-white/[0.04] rounded-xl -rotate-6 animate-[float_14s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[20%] right-[10%] w-32 h-32 border border-secondary/[0.06] rounded-3xl rotate-45 animate-[float_16s_ease-in-out_infinite_0.5s]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pt-28 pb-20 px-6">
        {/* Top section: Logo + headline + CTAs */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-6 flex justify-center animate-[fadeInDown_0.8s_ease-out]">
            <img
              src="/Medbridge_logo_White_RGB.svg"
              alt="MedBridge"
              className="h-10"
            />
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-4 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
            AI-Powered Health{" "}
            <span className="relative">
              Coaching
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary/40 rounded-full" />
            </span>{" "}
            Platform
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed mb-8 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            A LangGraph-orchestrated conversational AI system with multi-layer
            safety, clinical oversight, and intelligent patient engagement
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            <a
              href="#architecture"
              className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-white/20 text-white font-medium text-sm hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              Explore Architecture
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-secondary text-primary font-semibold text-sm hover:bg-accent transition-all duration-200 shadow-lg shadow-secondary/20"
            >
              Sign In
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Video player */}
        <div className="w-full max-w-5xl mx-auto animate-[fadeInUp_1s_ease-out_0.8s_both]">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10" style={{ aspectRatio: "16/9" }}>
            <RemotionPlayer />
          </div>
        </div>

        {/* Tech badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-[fadeInUp_0.8s_ease-out_1s_both]">
          {["LangGraph", "FastAPI", "Next.js 16", "React 19", "SQLAlchemy"].map(
            (tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-mono tracking-wide"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120V60C240 20 480 0 720 20C960 40 1200 80 1440 60V120H0Z"
            fill="#FAFAFA"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate, 0deg)); }
          50% { transform: translateY(-20px) rotate(var(--tw-rotate, 0deg)); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
