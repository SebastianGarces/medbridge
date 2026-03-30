"use client";

import { useState } from "react";

type HoveredNode =
  | "input"
  | "keyword"
  | "llm"
  | "safe"
  | "clinical"
  | "crisis"
  | "fallback"
  | null;

const safePathNodes: HoveredNode[] = ["input", "keyword", "llm", "safe"];
const clinicalPathNodes: HoveredNode[] = [
  "input",
  "keyword",
  "llm",
  "clinical",
];
const crisisPathNodes: HoveredNode[] = ["input", "keyword", "llm", "crisis"];
const blockedPathNodes: HoveredNode[] = ["input", "keyword", "fallback"];

function getNodePath(node: HoveredNode): HoveredNode[] {
  if (!node) return [];
  if (node === "safe") return safePathNodes;
  if (node === "clinical") return clinicalPathNodes;
  if (node === "crisis") return crisisPathNodes;
  if (node === "fallback") return blockedPathNodes;
  if (node === "input") return ["input", "keyword"];
  if (node === "keyword")
    return ["input", "keyword", "llm", "fallback"];
  if (node === "llm")
    return ["input", "keyword", "llm", "safe", "clinical", "crisis"];
  return [node];
}

export default function SafetyPipelineDiagram() {
  const [hovered, setHovered] = useState<HoveredNode>(null);

  const activePath = getNodePath(hovered);
  const nodeOpacity = (id: HoveredNode) =>
    hovered === null ? 1 : activePath.includes(id) ? 1 : 0.3;

  // Layout constants
  const cx = 400; // center x
  const colW = 240; // main pipeline box width
  const colX = cx - colW / 2;

  return (
    <svg
      viewBox="0 0 800 720"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="spArrow"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="#1B2021" />
        </marker>
        <marker
          id="spArrowGreen"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="#16A34A" />
        </marker>
        <marker
          id="spArrowAmber"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="#F59E0B" />
        </marker>
        <marker
          id="spArrowRed"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="#DC2626" />
        </marker>
        <marker
          id="spArrowGray"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="#666666" />
        </marker>
        <filter id="spShadow" x="-5%" y="-5%" width="115%" height="115%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="4"
            floodColor="#1B2021"
            floodOpacity="0.06"
          />
        </filter>
        <style>{`
          .sp-node { transition: opacity 0.3s ease; cursor: pointer; }
          .sp-conn { transition: opacity 0.3s ease; }
        `}</style>
      </defs>

      {/* ===== STAGE 1: INPUT ===== */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("input") }}
        onMouseEnter={() => setHovered("input")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x={colX}
          y="30"
          width={colW}
          height="44"
          rx="10"
          fill="#1B2021"
          filter="url(#spShadow)"
        />
        <text
          x={cx}
          y="56"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Coach Response
        </text>
      </g>

      {/* Arrow: Input -> Keyword */}
      <line
        x1={cx}
        y1="74"
        x2={cx}
        y2="120"
        stroke="#1B2021"
        strokeWidth="2"
        markerEnd="url(#spArrow)"
        className="sp-conn"
        style={{ opacity: nodeOpacity("keyword") }}
      />

      {/* ===== STAGE 2: KEYWORD FILTER ===== */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("keyword") }}
        onMouseEnter={() => setHovered("keyword")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x={colX}
          y="120"
          width={colW}
          height="60"
          rx="12"
          fill="white"
          stroke="#F59E0B"
          strokeWidth="2"
          filter="url(#spShadow)"
        />
        <rect
          x={colX}
          y="120"
          width={colW}
          height="28"
          rx="12"
          fill="#FEF9C3"
        />
        <rect
          x={colX}
          y="136"
          width={colW}
          height="12"
          fill="#FEF9C3"
        />
        <text
          x={cx}
          y="140"
          textAnchor="middle"
          fill="#92400E"
          fontSize="12"
          fontWeight="700"
          fontFamily="var(--font-inter), sans-serif"
        >
          Layer 1: Keyword Filter
        </text>
        <text
          x={cx}
          y="166"
          textAnchor="middle"
          fill="#666666"
          fontSize="9"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          Pattern-based filtering
        </text>
      </g>

      {/* PASS arrow: Keyword -> LLM */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("llm") }}
      >
        <line
          x1={cx}
          y1="180"
          x2={cx}
          y2="250"
          stroke="#16A34A"
          strokeWidth="2"
          markerEnd="url(#spArrowGreen)"
        />
        <rect
          x={cx - 22}
          y="206"
          width="44"
          height="16"
          rx="4"
          fill="#DCFCE7"
        />
        <text
          x={cx}
          y="218"
          textAnchor="middle"
          fill="#16A34A"
          fontSize="9"
          fontWeight="700"
        >
          PASS
        </text>
      </g>

      {/* BLOCKED arrow: Keyword -> Fallback (goes right, then down) */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("fallback") }}
      >
        <path
          d={`M ${colX + colW} 150 L 700 150 L 700 580`}
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          markerEnd="url(#spArrowRed)"
        />
        {/* BLOCKED label */}
        <rect x="630" y="128" width="62" height="16" rx="4" fill="#FEE2E2" />
        <text
          x="661"
          y="140"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="8"
          fontWeight="700"
        >
          BLOCKED
        </text>
      </g>

      {/* ===== STAGE 3: LLM CLASSIFIER ===== */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("llm") }}
        onMouseEnter={() => setHovered("llm")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x={colX}
          y="250"
          width={colW}
          height="60"
          rx="12"
          fill="white"
          stroke="#FFBE12"
          strokeWidth="2"
          filter="url(#spShadow)"
        />
        <rect
          x={colX}
          y="250"
          width={colW}
          height="28"
          rx="12"
          fill="#FFF8E1"
        />
        <rect
          x={colX}
          y="266"
          width={colW}
          height="12"
          fill="#FFF8E1"
        />
        <text
          x={cx}
          y="270"
          textAnchor="middle"
          fill="#c28502"
          fontSize="12"
          fontWeight="700"
          fontFamily="var(--font-inter), sans-serif"
        >
          Layer 2: LLM Classifier
        </text>
        <text
          x={cx}
          y="296"
          textAnchor="middle"
          fill="#888888"
          fontSize="9"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          Semantic safety classification
        </text>
      </g>

      {/* ===== THREE OUTPUT BRANCHES ===== */}

      {/* SAFE branch - left */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("safe") }}
      >
        <path
          d={`M ${colX + 40} 310 L 160 400`}
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          markerEnd="url(#spArrowGreen)"
        />
        <rect x="210" y="342" width="40" height="16" rx="4" fill="#DCFCE7" />
        <text
          x="230"
          y="354"
          textAnchor="middle"
          fill="#16A34A"
          fontSize="8"
          fontWeight="700"
        >
          SAFE
        </text>
      </g>

      {/* Safe output box */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("safe") }}
        onMouseEnter={() => setHovered("safe")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x="60"
          y="400"
          width="200"
          height="50"
          rx="10"
          fill="#DCFCE7"
          stroke="#16A34A"
          strokeWidth="1.5"
          filter="url(#spShadow)"
        />
        <text
          x="160"
          y="422"
          textAnchor="middle"
          fill="#14532D"
          fontSize="12"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Output to Patient
        </text>
        <text
          x="160"
          y="440"
          textAnchor="middle"
          fill="#16A34A"
          fontSize="8.5"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          response delivered
        </text>
      </g>

      {/* CLINICAL branch - center */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("clinical") }}
      >
        <line
          x1={cx}
          y1="310"
          x2={cx}
          y2="400"
          stroke="#F59E0B"
          strokeWidth="2"
          markerEnd="url(#spArrowAmber)"
        />
        <rect
          x={cx - 32}
          y="346"
          width="64"
          height="16"
          rx="4"
          fill="#FEF9C3"
        />
        <text
          x={cx}
          y="358"
          textAnchor="middle"
          fill="#F59E0B"
          fontSize="8"
          fontWeight="700"
        >
          CLINICAL
        </text>
      </g>

      {/* Clinical retry box */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("clinical") }}
        onMouseEnter={() => setHovered("clinical")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x={cx - 100}
          y="400"
          width="200"
          height="50"
          rx="10"
          fill="#FEF9C3"
          stroke="#F59E0B"
          strokeWidth="1.5"
          filter="url(#spShadow)"
        />
        <text
          x={cx}
          y="422"
          textAnchor="middle"
          fill="#92400E"
          fontSize="12"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Retry (1x)
        </text>
        <text
          x={cx}
          y="440"
          textAnchor="middle"
          fill="#F59E0B"
          fontSize="8.5"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          augmented prompt
        </text>
      </g>

      {/* Clinical retry loop-back arrow (goes left then up) */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("clinical") }}
      >
        <path
          d={`M ${cx - 100} 425 L 100 425 L 100 150 L ${colX} 150`}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          markerEnd="url(#spArrowAmber)"
        />
        <rect x="64" y="275" width="72" height="16" rx="4" fill="white" stroke="#E5E5E5" strokeWidth="0.5" />
        <text
          x="100"
          y="287"
          textAnchor="middle"
          fill="#F59E0B"
          fontSize="8"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          re-enter pipeline
        </text>
      </g>

      {/* CRISIS branch - right */}
      <g
        className="sp-conn"
        style={{ opacity: nodeOpacity("crisis") }}
      >
        <path
          d={`M ${colX + colW - 40} 310 L 610 400`}
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          markerEnd="url(#spArrowRed)"
        />
        <rect x="530" y="342" width="48" height="16" rx="4" fill="#FEE2E2" />
        <text
          x="554"
          y="354"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="8"
          fontWeight="700"
        >
          CRISIS
        </text>
      </g>

      {/* Crisis box */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("crisis") }}
        onMouseEnter={() => setHovered("crisis")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x="510"
          y="400"
          width="210"
          height="68"
          rx="10"
          fill="#FEE2E2"
          stroke="#DC2626"
          strokeWidth="2"
          filter="url(#spShadow)"
        />
        <text
          x="615"
          y="422"
          textAnchor="middle"
          fill="#7F1D1D"
          fontSize="12"
          fontWeight="700"
          fontFamily="var(--font-inter), sans-serif"
        >
          Crisis Alert
        </text>
        <text
          x="615"
          y="440"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="9"
          fontFamily="var(--font-inter), sans-serif"
        >
          Clinician notified + &quot;Call 988&quot;
        </text>
        <text
          x="615"
          y="458"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="8.5"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          alert_clinician()
        </text>
      </g>

      {/* ===== FALLBACK BOX ===== */}
      <g
        className="sp-node"
        style={{ opacity: nodeOpacity("fallback") }}
        onMouseEnter={() => setHovered("fallback")}
        onMouseLeave={() => setHovered(null)}
      >
        <rect
          x="590"
          y="580"
          width="180"
          height="80"
          rx="10"
          fill="#F8F8F8"
          stroke="#666666"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          filter="url(#spShadow)"
        />
        <text
          x="680"
          y="605"
          textAnchor="middle"
          fill="#1B2021"
          fontSize="11"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Safe Fallback Response
        </text>
        <text
          x="680"
          y="625"
          textAnchor="middle"
          fill="#666666"
          fontSize="8"
          fontFamily="var(--font-inter), sans-serif"
        >
          Canned safe message to patient
        </text>
        <text
          x="680"
          y="648"
          textAnchor="middle"
          fill="#888888"
          fontSize="7.5"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          SAFE_FALLBACK_MSG
        </text>
      </g>

      {/* FAIL label on the blocked->fallback path */}
      <g className="sp-conn" style={{ opacity: nodeOpacity("fallback") }}>
        <rect x="708" y="530" width="34" height="16" rx="4" fill="#FEE2E2" />
        <text
          x="725"
          y="542"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="7"
          fontWeight="700"
        >
          FAIL
        </text>
      </g>
    </svg>
  );
}
