"use client";

import type { Goal } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const progressClamped = Math.min(100, Math.max(0, goal.progress_pct));

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text text-sm">Current Goal</h3>
        {goal.target_date && (
          <span className="text-xs text-text-faint">
            Target: {new Date(goal.target_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <p className="text-text text-sm leading-relaxed mb-4">{goal.goal_text}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Progress</span>
          <span className="font-medium text-accent-dark">{progressClamped}%</span>
        </div>
        <div className="h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressClamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
