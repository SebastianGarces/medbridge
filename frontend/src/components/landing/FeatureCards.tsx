"use client";

import ScrollReveal from "./ScrollReveal";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    iconBg: "bg-accent/15 text-accent-dark",
    title: "Conversational AI Coach",
    description:
      "LangGraph-powered state machine orchestrates a 5-phase patient lifecycle. The coach adapts its behavior based on patient phase — from onboarding goal-setting to active exercise coaching to gentle re-engagement nudges.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    iconBg: "bg-success/10 text-success",
    title: "Two-Layer Safety System",
    description:
      "Every coach response passes through a fast keyword filter and an LLM-based classifier. Responses are categorized as SAFE, CLINICAL, or CRISIS — with automatic retry, safe fallbacks, and clinician alerts for emergencies.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    iconBg: "bg-secondary/15 text-accent-dark",
    title: "Clinical Oversight Dashboard",
    description:
      "Clinicians monitor all patients in real-time with filterable dashboards. Phase transitions, adherence metrics, and safety alerts are tracked with full conversation history available for review.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: "bg-warning/10 text-warning",
    title: "Intelligent Scheduling",
    description:
      "APScheduler manages follow-up check-ins with exponential backoff. Day 2 check-ins, Day 5 nudges, and Day 7 celebrations are automatically scheduled, with respectful backoff when patients disengage.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    iconBg: "bg-critical/10 text-critical",
    title: "Exercise Video Integration",
    description:
      "The AI coach references patient-specific exercises by embedding [EXERCISE:token] markers in responses. The frontend resolves tokens to MedBridge exercise videos with streaming playback.",
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="py-24 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-text tracking-tight mb-4">
              Core Capabilities
            </h2>
            <p className="text-text-muted leading-relaxed">
              Home exercise program adherence drops off dramatically without coaching.
              This platform uses conversational AI to keep patients engaged, while
              giving clinicians full visibility and control.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.1}>
              <div className="group bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:shadow-black/[0.03] hover:border-border/80 transition-all duration-300 h-full">
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg}`}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
