"use client";

import { useState, useCallback } from "react";

interface NodeDef {
  id: string;
  label: string;
  desc: string;
  x: number;
  y: number;
  bg: string;
  border: string;
  textColor: string;
}

interface EdgeDef {
  from: string;
  to: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
  labelAnchor?: "start" | "middle" | "end";
}

const nodes: NodeDef[] = [
  {
    id: "PENDING",
    label: "PENDING",
    desc: "Awaiting consent",
    x: 50,
    y: 200,
    bg: "#F0EFEE",
    border: "#1B2021",
    textColor: "#1B2021",
  },
  {
    id: "ONBOARDING",
    label: "ONBOARDING",
    desc: "Setting exercise goal",
    x: 280,
    y: 200,
    bg: "#FEF9C3",
    border: "#F59E0B",
    textColor: "#92400E",
  },
  {
    id: "ACTIVE",
    label: "ACTIVE",
    desc: "Engaging with coach",
    x: 530,
    y: 100,
    bg: "#DCFCE7",
    border: "#16A34A",
    textColor: "#14532D",
  },
  {
    id: "RE_ENGAGING",
    label: "RE_ENGAGING",
    desc: "Sending nudges",
    x: 530,
    y: 280,
    bg: "#FEE2E2",
    border: "#DC2626",
    textColor: "#7F1D1D",
  },
  {
    id: "DORMANT",
    label: "DORMANT",
    desc: "Awaiting return",
    x: 530,
    y: 430,
    bg: "#F8F8F8",
    border: "#666666",
    textColor: "#333333",
  },
];

const nodeW = 160;
const nodeH = 52;

const edges: EdgeDef[] = [
  {
    from: "PENDING",
    to: "ONBOARDING",
    label: "consent_verified",
    path: `M ${50 + nodeW} ${200 + nodeH / 2} L ${280} ${200 + nodeH / 2}`,
    labelX: 195,
    labelY: 215,
  },
  {
    from: "ONBOARDING",
    to: "ACTIVE",
    label: "goal_set",
    path: `M ${280 + nodeW} ${200 + 10} Q ${490} ${130} ${530} ${100 + nodeH / 2}`,
    labelX: 470,
    labelY: 148,
  },
  {
    from: "ACTIVE",
    to: "RE_ENGAGING",
    label: "3 missed check-ins",
    path: `M ${530 + nodeW + 10} ${100 + nodeH} L ${530 + nodeW + 10} ${280}`,
    labelX: 530 + nodeW + 18,
    labelY: 200,
    labelAnchor: "start",
  },
  {
    from: "RE_ENGAGING",
    to: "ACTIVE",
    label: "patient responds",
    path: `M ${530 + nodeW - 20} ${280} L ${530 + nodeW - 20} ${100 + nodeH}`,
    labelX: 530 + nodeW - 28,
    labelY: 200,
    labelAnchor: "end",
  },
  {
    from: "RE_ENGAGING",
    to: "DORMANT",
    label: "backoff exhausted",
    path: `M ${530 + nodeW + 10} ${280 + nodeH} L ${530 + nodeW + 10} ${430}`,
    labelX: 530 + nodeW + 18,
    labelY: 378,
    labelAnchor: "start",
  },
  {
    from: "DORMANT",
    to: "ACTIVE",
    label: "patient returns",
    path: `M ${530} ${430 + nodeH / 2} Q ${390} ${456} ${390} ${350} Q ${390} ${126} ${530} ${126}`,
    labelX: 378,
    labelY: 320,
    labelAnchor: "end",
  },
];

export default function StateMachineDiagram() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const connectedEdges = useCallback(
    (nodeId: string) =>
      edges.filter((e) => e.from === nodeId || e.to === nodeId),
    []
  );

  const isEdgeHighlighted = (edge: EdgeDef) => {
    if (!hoveredNode) return true;
    return edge.from === hoveredNode || edge.to === hoveredNode;
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return connectedEdges(hoveredNode).some(
      (e) => e.from === nodeId || e.to === nodeId
    );
  };

  return (
    <svg
      viewBox="0 0 900 520"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="smArrow"
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
        >
          <path d="M0,1 L8,4 L0,7" fill="#1B2021" />
        </marker>
        <marker
          id="smArrowDim"
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
        >
          <path d="M0,1 L8,4 L0,7" fill="#CCCCCC" />
        </marker>
        <filter id="smShadow" x="-8%" y="-8%" width="120%" height="130%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="5"
            floodColor="#1B2021"
            floodOpacity="0.07"
          />
        </filter>
        <filter id="smGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="8"
            floodColor="#FFBE12"
            floodOpacity="0.4"
          />
        </filter>
        <style>{`
          .sm-edge { transition: opacity 0.3s ease, stroke 0.3s ease; }
          .sm-node { transition: opacity 0.3s ease, filter 0.3s ease; }
          .sm-label { transition: opacity 0.3s ease; }
        `}</style>
      </defs>

      {/* Edges */}
      {edges.map((edge) => {
        const highlighted = isEdgeHighlighted(edge);
        // Measure approx label width for background rect
        const labelLen = edge.label.length * 6;
        const labelW = labelLen + 12;
        const isMiddle = (edge.labelAnchor || "middle") === "middle";
        const isEnd = edge.labelAnchor === "end";
        const bgX = isMiddle
          ? edge.labelX - labelW / 2
          : isEnd
            ? edge.labelX - labelW
            : edge.labelX;

        return (
          <g
            key={`${edge.from}-${edge.to}`}
            className="sm-edge"
            style={{ opacity: highlighted ? 1 : 0.2 }}
          >
            <path
              d={edge.path}
              fill="none"
              stroke={highlighted ? "#1B2021" : "#CCCCCC"}
              strokeWidth={highlighted ? 2 : 1.5}
              markerEnd={highlighted ? "url(#smArrow)" : "url(#smArrowDim)"}
            />
            {/* White background behind label */}
            <rect
              x={bgX}
              y={edge.labelY - 11}
              width={labelW}
              height={16}
              rx="3"
              fill="white"
              stroke={highlighted ? "#E5E5E5" : "none"}
              strokeWidth="0.5"
            />
            <text
              x={edge.labelX}
              y={edge.labelY}
              textAnchor={edge.labelAnchor || "middle"}
              fill={highlighted ? "#666666" : "#CCCCCC"}
              fontSize="9"
              fontFamily="var(--font-jetbrains-mono), monospace"
              className="sm-label"
            >
              {edge.label}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const highlighted = isNodeHighlighted(node.id);
        const isHovered = hoveredNode === node.id;

        return (
          <g
            key={node.id}
            className="sm-node"
            style={{
              opacity: highlighted ? 1 : 0.4,
              filter: isHovered ? "url(#smGlow)" : "url(#smShadow)",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <rect
              x={node.x}
              y={node.y}
              width={nodeW}
              height={nodeH}
              rx="12"
              fill={node.bg}
              stroke={node.border}
              strokeWidth={isHovered ? 2.5 : 1.5}
            />
            <text
              x={node.x + nodeW / 2}
              y={node.y + 21}
              textAnchor="middle"
              fill={node.textColor}
              fontSize="12"
              fontWeight="700"
              fontFamily="var(--font-jetbrains-mono), monospace"
            >
              {node.label}
            </text>
            <text
              x={node.x + nodeW / 2}
              y={node.y + 38}
              textAnchor="middle"
              fill={node.textColor}
              fontSize="8.5"
              opacity="0.7"
              fontFamily="var(--font-inter), sans-serif"
            >
              {node.desc}
            </text>
          </g>
        );
      })}

      {/* Start marker */}
      <g>
        <circle cx="25" cy={200 + nodeH / 2} r="9" fill="#1B2021" />
        <text
          x="25"
          y={200 + nodeH / 2 + 3.5}
          textAnchor="middle"
          fill="white"
          fontSize="9"
          fontWeight="bold"
        >
          S
        </text>
        <line
          x1="34"
          y1={200 + nodeH / 2}
          x2="48"
          y2={200 + nodeH / 2}
          stroke="#1B2021"
          strokeWidth="2"
          markerEnd="url(#smArrow)"
        />
      </g>
    </svg>
  );
}
