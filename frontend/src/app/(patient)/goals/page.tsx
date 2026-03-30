"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { GoalsPageData } from "@/lib/types";
import MetricCard from "@/components/patient/MetricCard";
import GoalCard from "@/components/patient/GoalCard";

export default function GoalsPage() {
  const [data, setData] = useState<GoalsPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<GoalsPageData>("/api/patient/goals")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <h2 className="font-semibold text-text mb-1">No Goals Yet</h2>
        <p className="text-sm text-text-muted">
          Chat with your AI coach to set your first goal
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-semibold text-text mb-1">My Goals</h1>
      <p className="text-sm text-text-muted mb-8">
        Track your progress and stay motivated
      </p>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Adherence"
          value={`${data.adherence.adherence_pct}%`}
          subtitle={`${data.adherence.sessions_completed} of ${data.adherence.sessions_total} sessions`}
          color="success"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
        <MetricCard
          label="Current Streak"
          value={`${data.adherence.streak}`}
          subtitle={`Best: ${data.adherence.best_streak} days`}
          color="primary"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
        <MetricCard
          label="Next Check-in"
          value="Today"
          subtitle="Chat with your coach"
          color="secondary"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      </div>

      {/* Goal card */}
      {data.goal && (
        <div className="mb-6">
          <GoalCard goal={data.goal} />
        </div>
      )}

      {/* Weekly activity */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-text text-sm mb-4">Weekly Activity</h3>
        <div className="flex items-center justify-between">
          {data.week_days.map((day) => (
            <div key={day.label} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  day.completed
                    ? "bg-success text-white"
                    : day.is_today
                    ? "border-2 border-accent-dark text-accent-dark bg-accent-light"
                    : day.is_future
                    ? "bg-surface text-text-faint"
                    : "bg-surface text-text-light border border-border"
                }`}
              >
                {day.completed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  day.label.charAt(0)
                )}
              </div>
              <span className={`text-xs ${day.is_today ? "font-semibold text-accent-dark" : "text-text-faint"}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
