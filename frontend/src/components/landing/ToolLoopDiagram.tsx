"use client";

import { useState } from "react";

interface ToolDef {
  id: string;
  name: string;
  desc: string;
  signature: string;
  returnType: string;
  color: string;
  colorLight: string;
  textColor: string;
}

const tools: ToolDef[] = [
  {
    id: "program",
    name: "get_program_summary",
    desc: "Patient's assigned exercises",
    signature: "get_program_summary(patient_id: str)",
    returnType: "-> ProgramSummary",
    color: "#FFBE12",
    colorLight: "#FFF8E1",
    textColor: "#92400E",
  },
  {
    id: "adherence",
    name: "get_adherence_summary",
    desc: "Streak, completion rate, best streak",
    signature: "get_adherence_summary(patient_id: str)",
    returnType: "-> AdherenceSummary",
    color: "#16A34A",
    colorLight: "#DCFCE7",
    textColor: "#14532D",
  },
  {
    id: "goal",
    name: "set_goal",
    desc: "Create/update exercise goal",
    signature: "set_goal(patient_id: str, goal: str)",
    returnType: "-> Goal",
    color: "#F59E0B",
    colorLight: "#FEF9C3",
    textColor: "#92400E",
  },
  {
    id: "reminder",
    name: "set_reminder",
    desc: "Schedule custom follow-up",
    signature: "set_reminder(patient_id: str, hours: int, msg: str)",
    returnType: "-> Reminder",
    color: "#FFBE12",
    colorLight: "#FFF8E1",
    textColor: "#92400E",
  },
  {
    id: "alert",
    name: "alert_clinician",
    desc: "Escalate to care team",
    signature: "alert_clinician(patient_id: str, reason: str)",
    returnType: "-> Alert",
    color: "#DC2626",
    colorLight: "#FEE2E2",
    textColor: "#7F1D1D",
  },
];

const loopSteps = ["Tool Call", "Execute", "Result", "Next Decision"];

export default function ToolLoopDiagram() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* Tool grid: center agent with tools around it */}
      <div className="flex flex-col items-center gap-6">
        {/* Top row: 3 tools */}
        <div className="flex items-start justify-center gap-6 md:gap-10 w-full">
          {tools.slice(0, 3).map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isHovered={hoveredTool === tool.id}
              isDimmed={hoveredTool !== null && hoveredTool !== tool.id}
              onHover={() => setHoveredTool(tool.id)}
              onLeave={() => setHoveredTool(null)}
            />
          ))}
        </div>

        {/* Center row: LLM Agent with connection lines implied */}
        <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
          {/* Left tool */}
          <ToolCard
            tool={tools[3]}
            isHovered={hoveredTool === tools[3].id}
            isDimmed={hoveredTool !== null && hoveredTool !== tools[3].id}
            onHover={() => setHoveredTool(tools[3].id)}
            onLeave={() => setHoveredTool(null)}
          />

          {/* Center agent circle */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#1B2021] flex flex-col items-center justify-center shadow-lg relative">
              <div className="absolute inset-1 rounded-full border-2 border-[#FFBE12]/40" />
              <span className="text-2xl">{"🧠"}</span>
              <span className="text-white text-xs font-bold font-sans mt-0.5">
                LLM Agent
              </span>
              <span className="text-white/50 text-[8px] font-sans">
                LangGraph Node
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#FFBE12] bg-[#1B2021] px-3 py-1 rounded-full border border-[#FFBE12]/50">
              Max 5 iterations
            </span>
          </div>

          {/* Right tool */}
          <ToolCard
            tool={tools[4]}
            isHovered={hoveredTool === tools[4].id}
            isDimmed={hoveredTool !== null && hoveredTool !== tools[4].id}
            onHover={() => setHoveredTool(tools[4].id)}
            onLeave={() => setHoveredTool(null)}
          />
        </div>
      </div>

      {/* Loop steps bar */}
      <div className="mt-8 mx-auto max-w-lg">
        <div className="flex items-center justify-center bg-[#F8F8F8] border border-[#E5E5E5] rounded-lg px-3 py-2.5">
          {loopSteps.map((step, i) => (
            <div key={step} className="flex items-center">
              <span
                className={`text-[10px] md:text-xs font-semibold font-mono px-2.5 py-1 rounded-md ${
                  i === 0 || i === 3
                    ? "bg-[#1B2021] text-white"
                    : "bg-white text-[#1B2021] border border-[#E5E5E5]"
                }`}
              >
                {step}
              </span>
              {i < loopSteps.length - 1 && (
                <span className="text-[#FFBE12] text-sm font-bold mx-1.5 md:mx-2.5">
                  {"\u2192"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  isHovered,
  isDimmed,
  onHover,
  onLeave,
}: {
  tool: ToolDef;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className="relative flex-shrink-0 w-[140px] md:w-[170px] transition-opacity duration-300 cursor-pointer"
      style={{ opacity: isDimmed ? 0.7 : 1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Card */}
      <div
        className="rounded-lg border px-3 py-2.5 transition-all duration-200"
        style={{
          backgroundColor: isHovered ? tool.colorLight : "white",
          borderColor: tool.color,
          borderWidth: isHovered ? 2 : 1.5,
          boxShadow: isHovered
            ? `0 0 16px ${tool.color}30`
            : "0 2px 8px rgba(27,32,33,0.06)",
        }}
      >
        <div
          className="text-[9px] md:text-[10px] font-bold font-mono leading-tight truncate"
          style={{ color: tool.textColor }}
        >
          {tool.name}
        </div>
        <div className="text-[8px] md:text-[9px] text-[#666666] font-sans mt-0.5 leading-snug">
          {tool.desc}
        </div>
      </div>

      {/* Tooltip (below card) */}
      {isHovered && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-md border px-2.5 py-2 z-10"
          style={{
            backgroundColor: tool.colorLight,
            borderColor: tool.color,
          }}
        >
          <div
            className="text-[7.5px] md:text-[8px] font-mono leading-relaxed truncate"
            style={{ color: tool.textColor }}
          >
            {tool.signature}
          </div>
          <div className="text-[7.5px] md:text-[8px] font-mono text-[#888888] truncate">
            {tool.returnType}
          </div>
        </div>
      )}
    </div>
  );
}
