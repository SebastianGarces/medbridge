"use client";

import ScrollReveal from "./ScrollReveal";
import SystemOverviewDiagram from "./SystemOverviewDiagram";
import StateMachineDiagram from "./StateMachineDiagram";
import SafetyPipelineDiagram from "./SafetyPipelineDiagram";
import ToolLoopDiagram from "./ToolLoopDiagram";

const diagrams = [
  {
    title: "System Overview",
    subtitle:
      "Three-tier architecture: Next.js frontend, FastAPI backend, and LangGraph AI engine connected via REST and SSE.",
    Component: SystemOverviewDiagram,
    delay: 0,
  },
  {
    title: "LangGraph Lifecycle",
    subtitle:
      "Five-phase state machine governing patient engagement from consent through active coaching to dormancy.",
    Component: StateMachineDiagram,
    delay: 0.1,
  },
  {
    title: "Safety Pipeline",
    subtitle:
      "Two-layer content filtering ensures every AI response is clinically safe before reaching the patient.",
    Component: SafetyPipelineDiagram,
    delay: 0.1,
  },
  {
    title: "Tool Loop",
    subtitle:
      "The LLM agent iterates through bound tools, executing up to five calls per turn to gather context and take action.",
    Component: ToolLoopDiagram,
    delay: 0.1,
  },
];

export default function ArchitectureDiagrams() {
  return (
    <section id="architecture" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text mb-3 tracking-tight">
              Architecture Deep-Dive
            </h2>
            <p className="text-text-muted text-sm md:text-base max-w-xl mx-auto">
              Interactive diagrams — hover over elements to explore connections
              and data flow
            </p>
          </div>
        </ScrollReveal>

        {/* Diagrams stacked vertically */}
        <div className="space-y-20 md:space-y-28">
          {diagrams.map(({ title, subtitle, Component, delay }) => (
            <ScrollReveal key={title} delay={delay}>
              <div>
                <div className="mb-6">
                  <h3 className="font-serif text-xl md:text-2xl font-semibold text-text mb-1.5 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-text-muted text-sm max-w-lg">{subtitle}</p>
                </div>
                <div
                  className="bg-white rounded-xl border border-border p-4 md:p-8"
                  style={{ boxShadow: "0 4px 24px rgba(27,32,33,0.04)" }}
                >
                  <Component />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
