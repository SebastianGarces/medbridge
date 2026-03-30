"use client";

interface PhaseBadgeProps {
  phase: string;
  size?: "sm" | "md";
}

const phaseConfig: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-success-light", text: "text-success", label: "Active" },
  ONBOARDING: { bg: "bg-warning-light", text: "text-warning", label: "Onboarding" },
  RE_ENGAGING: { bg: "bg-critical-light", text: "text-critical", label: "Re-engaging" },
  DORMANT: { bg: "bg-surface-alt", text: "text-text-muted", label: "Dormant" },
};

export default function PhaseBadge({ phase, size = "sm" }: PhaseBadgeProps) {
  const config = phaseConfig[phase] || {
    bg: "bg-surface-alt",
    text: "text-text-muted",
    label: phase,
  };

  const sizeClasses = size === "sm" ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace("text-", "bg-")}`}
      />
      {config.label}
    </span>
  );
}
