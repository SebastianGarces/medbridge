"use client";

import Link from "next/link";
import type { PatientSummary } from "@/lib/types";
import PhaseBadge from "./PhaseBadge";

interface PatientTableProps {
  patients: PatientSummary[];
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
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
  return date.toLocaleDateString();
}

export default function PatientTable({ patients }: PatientTableProps) {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center">
        <svg
          className="mx-auto text-text-faint mb-3"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="17" y1="11" x2="23" y2="11" />
        </svg>
        <p className="text-text-muted text-sm">No patients found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-alt/50">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
              Name
            </th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
              Phase
            </th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
              Adherence
            </th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
              Last Active
            </th>
            <th className="text-center text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
              Alerts
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              className="border-b border-border last:border-b-0 hover:bg-surface-alt/30 transition-colors"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/clinician/patients/${patient.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-dark font-semibold text-sm flex-shrink-0">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-text group-hover:text-accent-dark transition-colors">
                    {patient.name}
                  </span>
                </Link>
              </td>
              <td className="px-5 py-3.5">
                <PhaseBadge phase={patient.phase} />
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (patient.adherence_pct ?? 0) >= 70
                          ? "bg-success"
                          : (patient.adherence_pct ?? 0) >= 40
                            ? "bg-warning"
                            : "bg-critical"
                      }`}
                      style={{ width: `${patient.adherence_pct ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-muted tabular-nums">
                    {patient.adherence_pct ?? 0}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-sm text-text-muted">
                  {formatRelativeTime(patient.last_interaction_at)}
                </span>
              </td>
              <td className="px-5 py-3.5 text-center">
                {(patient.alert_count ?? 0) > 0 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-critical text-white text-xs font-semibold">
                    {patient.alert_count}
                  </span>
                ) : (
                  <span className="text-text-faint text-sm">&mdash;</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
