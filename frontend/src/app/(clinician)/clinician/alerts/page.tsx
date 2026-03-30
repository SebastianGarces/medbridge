"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import type { Alert } from "@/lib/types";
import AlertCard from "@/components/clinician/AlertCard";
import { useAlerts } from "@/lib/useAlerts";

type SeverityFilter = "" | "critical" | "warning";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SeverityFilter>("");
  const { mutate } = useAlerts();

  const fetchAlerts = useCallback(async (severity?: string) => {
    try {
      const path = severity
        ? `/api/clinician/alerts?severity=${severity}`
        : "/api/clinician/alerts";
      const data = await apiGet<{ alerts: Alert[] }>(path);
      setAlerts(data.alerts || []);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(filter || undefined);
  }, [filter, fetchAlerts]);

  function handleFilterChange(newFilter: SeverityFilter) {
    setFilter(newFilter);
    setLoading(true);
  }

  function handleAcknowledged(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      )
    );
    mutate();
  }

  const filterButtons: { label: string; value: SeverityFilter }[] = [
    { label: "All", value: "" },
    { label: "Critical", value: "critical" },
    { label: "Warning", value: "warning" },
  ];

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="h-7 w-32 bg-surface-alt rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-surface-alt rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-20 bg-surface-alt rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-lg border border-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Alerts</h1>
        <p className="text-sm text-text-muted mt-1">
          {unacknowledgedCount > 0
            ? `${unacknowledgedCount} unacknowledged alert${unacknowledgedCount !== 1 ? "s" : ""}`
            : "All alerts acknowledged"}
        </p>
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-2 mb-6">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleFilterChange(btn.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === btn.value
                ? "bg-text text-white"
                : "bg-white text-text-muted border border-border hover:bg-surface-alt"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
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
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </svg>
          <p className="text-text-muted text-sm">
            {filter
              ? `No ${filter} alerts found`
              : "No alerts at this time"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledged={handleAcknowledged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
