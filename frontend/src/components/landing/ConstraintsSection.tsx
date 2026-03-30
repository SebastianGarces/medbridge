"use client";

import ScrollReveal from "./ScrollReveal";

const decisions = [
  {
    question: "Why LangGraph over raw LLM chains?",
    answer:
      "Raw chains lack deterministic state control. LangGraph's StateGraph with conditional edges enforces valid phase transitions (e.g., a patient can't skip consent), prevents invalid states, and makes the lifecycle testable and debuggable.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    question: "Why two-layer safety instead of one?",
    answer:
      "The keyword filter catches obvious violations in microseconds — no API call needed. The LLM classifier handles nuanced cases (distinguishing exercise advice from medical advice). The combination minimizes latency for clear cases while maintaining accuracy for edge cases.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    question: "Why exponential backoff for re-engagement?",
    answer:
      "Fixed-interval reminders feel like spam. Exponential backoff (2^n days) spaces out follow-ups respectfully. After 3 unanswered attempts, the patient transitions to DORMANT rather than receiving infinite nudges.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    question: "Why consent-first architecture?",
    answer:
      "Consent isn't a checkbox — it's a state machine phase. The PENDING phase blocks all AI interaction until consent is granted. Revoking consent cancels all scheduled jobs and returns to PENDING. This makes HIPAA compliance structural, not procedural.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

export default function ConstraintsSection() {
  return (
    <section className="py-24 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-text tracking-tight mb-4">
              Engineering Design Decisions
            </h2>
            <p className="text-text-muted leading-relaxed">
              Key architectural tradeoffs and their rationale
            </p>
          </div>
        </ScrollReveal>

        {/* Decision grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {decisions.map((decision, i) => (
            <ScrollReveal key={decision.question} delay={i * 0.1}>
              <div className="bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:shadow-black/[0.03] transition-all duration-300 h-full">
                {/* Icon + Question */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 text-primary/70">
                    {decision.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-text leading-snug pt-1">
                    {decision.question}
                  </h3>
                </div>

                {/* Answer */}
                <p className="text-sm text-text-muted leading-relaxed pl-12">
                  {decision.answer}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
