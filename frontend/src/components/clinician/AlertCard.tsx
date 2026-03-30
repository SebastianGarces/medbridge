"use client";

import { useState } from "react";
import type { Alert } from "@/lib/types";
import { apiPost } from "@/lib/api";

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
  onAcknowledged?: (alertId: string) => void;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const severityConfig: Record<string, { border: string; bg: string; icon: string }> = {
  critical: {
    border: "border-l-critical",
    bg: "bg-critical-light/30",
    icon: "text-critical",
  },
  warning: {
    border: "border-l-warning",
    bg: "bg-warning-light/30",
    icon: "text-warning",
  },
};

const SeverityIcon = ({ severity }: { severity: string }) =>
  severity === "critical" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );

export default function AlertCard({ alert, compact, onAcknowledged }: AlertCardProps) {
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(alert.acknowledged);

  const config = severityConfig[alert.severity] || severityConfig.warning;

  async function handleAcknowledge() {
    setAcknowledging(true);
    try {
      await apiPost(`/api/clinician/alerts/${alert.id}/acknowledge`);
      setAcknowledged(true);
      onAcknowledged?.(alert.id);
    } catch {
      // Silently fail - user can retry
    } finally {
      setAcknowledging(false);
    }
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-border border-l-4 ${config.border} p-3 transition-all ${
          acknowledged ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={`flex items-center gap-1.5 ${config.icon}`}>
            <SeverityIcon severity={alert.severity} />
            <span className="text-xs font-semibold uppercase">
              {alert.severity}
            </span>
          </div>
          {acknowledged ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Acknowledged
            </span>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="text-[11px] font-medium px-2 py-1 rounded bg-accent/10 text-accent-dark hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {acknowledging ? "..." : "Acknowledge"}
            </button>
          )}
        </div>
        <p className="text-xs font-medium text-text leading-snug">
          {alert.title}
        </p>
        <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-3">
          {alert.description}
        </p>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-text-faint">
          {alert.patient_name && (
            <span className="font-medium text-text-light">{alert.patient_name}</span>
          )}
          <span>{formatTimestamp(alert.created_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-border border-l-4 ${config.border} p-4 transition-all hover:shadow-sm ${
        acknowledged ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 ${config.icon}`}>
            <SeverityIcon severity={alert.severity} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-text leading-tight">
              {alert.title}
            </h3>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">
              {alert.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {alert.patient_name && (
                <span className="text-xs text-text-light font-medium">
                  {alert.patient_name}
                </span>
              )}
              <span className="text-xs text-text-faint">
                {formatTimestamp(alert.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {acknowledged ? (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Acknowledged
            </span>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent/10 text-accent-dark hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {acknowledging ? "..." : "Acknowledge"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
