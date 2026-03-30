"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { PatientDetailData, Alert } from "@/lib/types";
import PhaseBadge from "@/components/clinician/PhaseBadge";
import AlertCard from "@/components/clinician/AlertCard";
import { useAlerts } from "@/lib/useAlerts";

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTransitionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const [data, setData] = useState<PatientDetailData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { mutate } = useAlerts();

  useEffect(() => {
    async function load() {
      try {
        const [detail, alertsData] = await Promise.all([
          apiGet<PatientDetailData>(`/api/clinician/patients/${patientId}`),
          apiGet<{ alerts: Alert[] }>(`/api/clinician/alerts?patient_id=${patientId}`).catch(
            () => ({ alerts: [] })
          ),
        ]);
        setData(detail);
        setAlerts(alertsData.alerts || []);
      } catch {
        // Error state - leave data null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-4 w-48 bg-surface-alt rounded mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-surface-alt" />
          <div>
            <div className="h-6 w-40 bg-surface-alt rounded mb-2" />
            <div className="h-4 w-24 bg-surface-alt rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-surface-alt rounded-xl" />
          <div className="h-96 bg-surface-alt rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-text-muted">Patient not found</p>
          <Link
            href="/clinician/dashboard"
            className="text-accent-dark text-sm mt-2 inline-block hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { patient, messages, transitions, goal, adherence } = data;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link
          href="/clinician/dashboard"
          className="text-text-muted hover:text-accent-dark transition-colors"
        >
          Dashboard
        </Link>
        <span className="text-text-faint">/</span>
        <span className="text-text font-medium">{patient.name}</span>
      </nav>

      {/* Patient header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent-dark text-xl font-semibold">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <PhaseBadge phase={patient.phase} size="md" />
            {patient.adherence_pct !== undefined && (
              <span className="text-sm text-text-muted">
                {patient.adherence_pct}% adherence
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Conversation transcript */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-text">Conversation History</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto text-text-faint mb-3"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p className="text-sm text-text-muted">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                        msg.role === "user"
                          ? "bg-accent/10 text-accent-dark"
                          : "bg-surface-alt text-text-muted"
                      }`}
                    >
                      {msg.role === "user" ? "P" : "AI"}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-surface-alt text-text"
                      }`}
                    >
                      {msg.content_html ? (
                        <div
                          className="text-sm leading-relaxed coach-message"
                          dangerouslySetInnerHTML={{ __html: msg.content_html }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                      <p
                        className={`text-[10px] mt-1.5 ${
                          msg.role === "user"
                            ? "text-white/60"
                            : "text-text-faint"
                        }`}
                      >
                        {formatMessageTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Goal card */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm text-text mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              Current Goal
            </h3>
            {goal ? (
              <div>
                <p className="text-sm text-text leading-relaxed">{goal.goal_text}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Progress</span>
                    <span className="font-medium text-accent-dark">{goal.progress_pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${goal.progress_pct}%` }}
                    />
                  </div>
                </div>
                {goal.target_date && (
                  <p className="text-xs text-text-faint mt-2">
                    Target: {new Date(goal.target_date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No goal set yet</p>
            )}
          </div>

          {/* Adherence card */}
          {adherence && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm text-text mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Adherence
              </h3>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-semibold text-success">{adherence.adherence_pct}%</span>
                <span className="text-xs text-text-faint">{adherence.streak} day streak</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${adherence.adherence_pct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-surface p-2.5">
                  <p className="text-lg font-semibold text-text">{adherence.sessions_completed}</p>
                  <p className="text-[11px] text-text-faint">Sessions done</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <p className="text-lg font-semibold text-text">{adherence.best_streak}</p>
                  <p className="text-[11px] text-text-faint">Best streak</p>
                </div>
              </div>
            </div>
          )}

          {/* Phase History */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm text-text mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Phase History
            </h3>
            {transitions.length === 0 ? (
              <p className="text-sm text-text-muted">No phase transitions</p>
            ) : (
              <div className="space-y-0">
                {transitions.map((t, idx) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1 flex-shrink-0" />
                      {idx < transitions.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <PhaseBadge phase={t.from_phase} />
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-text-faint"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                        <PhaseBadge phase={t.to_phase} />
                      </div>
                      {t.reason && (
                        <p className="text-xs text-text-muted mt-1">
                          {t.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-text-faint mt-1">
                        {formatTransitionDate(t.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm text-text mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
              </svg>
              Alerts
              {alerts.length > 0 && (
                <span className="ml-auto text-xs text-text-faint">
                  {alerts.length}
                </span>
              )}
            </h3>
            {alerts.length === 0 ? (
              <p className="text-sm text-text-muted">No alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} compact onAcknowledged={() => mutate()} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
