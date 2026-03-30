"use client";

import type { DashboardStats } from "@/lib/types";

interface StatsGridProps {
  stats: DashboardStats;
}

const statCards = [
  {
    key: "active" as const,
    label: "Active Patients",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "text-accent-dark",
    iconBg: "bg-accent/10",
    format: (v: number) => String(v),
  },
  {
    key: "avg_adherence" as const,
    label: "Avg Adherence",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    color: "text-success",
    iconBg: "bg-success/10",
    format: (v: number) => `${Math.round(v)}%`,
  },
  {
    key: "pending_alerts" as const,
    label: "Pending Alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
    ),
    color: "text-warning",
    iconBg: "bg-warning/10",
    format: (v: number) => String(v),
  },
  {
    key: "dormant" as const,
    label: "Dormant",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    color: "text-text-muted",
    iconBg: "bg-surface-alt",
    format: (v: number) => String(v),
  },
];

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.key}
          className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted font-medium">{card.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${card.color}`}>
                {card.format(stats[card.key])}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center ${card.color}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
