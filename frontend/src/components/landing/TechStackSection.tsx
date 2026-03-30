"use client";

import ScrollReveal from "./ScrollReveal";

const techStack = [
  {
    name: "LangGraph",
    description:
      "Graph-based orchestration engine for deterministic phase transitions. StateGraph with conditional edges ensures patients always follow valid lifecycle paths.",
  },
  {
    name: "FastAPI",
    description:
      "Async-first Python web framework with Pydantic validation and dependency injection. Handles SSE streaming, JWT auth, and consent gating.",
  },
  {
    name: "Next.js 16 + React 19",
    description:
      "Latest App Router with server components and client islands. Real-time chat via Server-Sent Events with optimistic UI updates.",
  },
  {
    name: "SQLAlchemy (Async)",
    description:
      "Type-safe async ORM with relationship loading. Manages patients, messages, goals, alerts, exercises, and phase transitions.",
  },
  {
    name: "APScheduler",
    description:
      "Persistent job scheduling with SQLAlchemy job store. Survives server restarts. Manages follow-up check-ins with exponential backoff delays.",
  },
  {
    name: "Tailwind CSS v4",
    description:
      "Utility-first CSS with inline theme tokens. Custom design system with semantic color palette, 3 font families, and consistent spacing scale.",
  },
];

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="py-24 md:py-32 bg-surface-alt">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-text tracking-tight mb-4">
              Technology Stack
            </h2>
            <p className="text-text-muted leading-relaxed">
              Chosen for async performance, type safety, and AI-native orchestration
            </p>
          </div>
        </ScrollReveal>

        {/* Tech grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {techStack.map((tech, i) => (
            <ScrollReveal key={tech.name} delay={i * 0.08}>
              <div className="group bg-white rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/[0.03] hover:border-secondary/30 transition-all duration-300 h-full">
                {/* Accent bar */}
                <div className="w-8 h-0.5 bg-secondary rounded-full mb-4 group-hover:w-12 transition-all duration-300" />

                {/* Tech name */}
                <h3 className="font-mono text-sm font-bold text-text mb-2 tracking-wide">
                  {tech.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed">
                  {tech.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
