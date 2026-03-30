"use client";

import { useState } from "react";

type Column = "frontend" | "backend" | "ai" | null;

interface StackItem {
  label: string;
  desc: string;
}

interface ColumnDef {
  id: Column;
  title: string;
  subtitle: string;
  iconBg: string;
  icon: string;
  items: StackItem[];
  tag: string;
}

const columns: ColumnDef[] = [
  {
    id: "frontend",
    title: "Next.js 16 + React 19",
    subtitle: "Frontend Application",
    iconBg: "bg-[#FFBE12]",
    icon: "<>",
    items: [
      { label: "App Router", desc: "File-based routing" },
      { label: "SSE Client", desc: "Real-time streaming" },
      { label: "Auth Provider", desc: "JWT session management" },
      { label: "Tailwind v4", desc: "Utility-first CSS" },
    ],
    tag: "FRONTEND",
  },
  {
    id: "backend",
    title: "FastAPI",
    subtitle: "Backend Services",
    iconBg: "bg-[#16A34A]",
    icon: "{ }",
    items: [
      { label: "JWT Auth", desc: "Token-based authentication" },
      { label: "Consent Gate", desc: "HIPAA consent enforcement" },
      { label: "Safety Layer", desc: "2-tier response filtering" },
      { label: "APScheduler", desc: "Follow-up scheduling" },
      { label: "SQLAlchemy", desc: "ORM + SQLite persistence" },
    ],
    tag: "BACKEND",
  },
  {
    id: "ai",
    title: "LLM (via OpenRouter)",
    subtitle: "AI Engine",
    iconBg: "bg-[#DC2626]",
    icon: "AI",
    items: [
      { label: "LangGraph", desc: "Stateful graph orchestration" },
      { label: "LangChain Tools", desc: "5 bound tool functions" },
      { label: "5-Phase FSM", desc: "Lifecycle state machine" },
    ],
    tag: "AI ENGINE",
  },
];

const connections: { from: Column; to: Column; labels: string[] }[] = [
  { from: "frontend", to: "backend", labels: ["REST API", "SSE"] },
  { from: "backend", to: "ai", labels: ["Tool Bind"] },
];

export default function SystemOverviewDiagram() {
  const [hovered, setHovered] = useState<Column>(null);

  const colOpacity = (col: Column) =>
    hovered === null ? 1 : hovered === col ? 1 : 0.6;

  const connOpacity = (cols: Column[]) =>
    hovered === null ? 1 : cols.includes(hovered) ? 1 : 0.4;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start justify-center gap-0 min-w-[720px] py-4">
        {columns.map((col, colIdx) => (
          <div key={col.id} className="flex items-start">
            {/* Column card */}
            <div
              className="w-[220px] flex-shrink-0 cursor-pointer transition-opacity duration-300"
              style={{ opacity: colOpacity(col.id) }}
              onMouseEnter={() => setHovered(col.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Header */}
              <div className="bg-[#1B2021] rounded-t-xl px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`${col.iconBg} w-7 h-7 rounded-md flex items-center justify-center`}
                  >
                    <span className="text-xs font-bold text-[#1B2021] select-none">
                      {col.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-[13px] font-semibold font-sans leading-tight truncate">
                      {col.title}
                    </div>
                    <div className="text-white/50 text-[9px] font-sans">
                      {col.subtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-t-0 border-[#E5E5E5] rounded-b-xl bg-[#FAFAFA] px-3 py-3 space-y-2">
                {col.items.map((item) => (
                  <div
                    key={item.label}
                    className="bg-white border border-dashed border-[#E5E5E5] rounded-lg px-3 py-2"
                  >
                    <div className="text-[11px] font-semibold font-mono text-[#1B2021] leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[8.5px] text-[#888888] font-sans mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tag */}
              <div className="text-center mt-3">
                <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AAAAAA] font-sans">
                  {col.tag}
                </span>
              </div>
            </div>

            {/* Connection arrow between columns */}
            {colIdx < columns.length - 1 && (
              <div
                className="flex-shrink-0 w-[60px] flex flex-col items-center justify-center pt-20 transition-opacity duration-300"
                style={{
                  opacity: connOpacity([
                    columns[colIdx].id,
                    columns[colIdx + 1].id,
                  ]),
                }}
              >
                {connections
                  .filter(
                    (c) =>
                      c.from === columns[colIdx].id &&
                      c.to === columns[colIdx + 1].id
                  )
                  .map((conn) => (
                    <div key={conn.labels.join()} className="space-y-3">
                      {/* Forward arrow */}
                      <div className="flex items-center gap-0">
                        <div className="w-[46px] h-[2px] bg-[#FFBE12] relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#FFBE12]" />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="flex flex-col items-center gap-1">
                        {conn.labels.map((label) => (
                          <span
                            key={label}
                            className="text-[8px] font-mono text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] rounded px-1.5 py-0.5 whitespace-nowrap"
                          >
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Return arrow */}
                      <div className="flex items-center gap-0">
                        <div className="w-[46px] h-[2px] bg-[#FFBE12] relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-[#FFBE12]" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
