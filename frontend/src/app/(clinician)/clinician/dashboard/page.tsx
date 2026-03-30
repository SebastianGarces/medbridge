"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiGet } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import StatsGrid from "@/components/clinician/StatsGrid";
import PatientTable from "@/components/clinician/PatientTable";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboard = useCallback(async (query?: string) => {
    try {
      const path = query
        ? `/api/clinician/dashboard?q=${encodeURIComponent(query)}`
        : "/api/clinician/dashboard";
      const result = await apiGet<DashboardData>(path);
      setData(result);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchDashboard(value || undefined);
    }, 300);
  }

  if (loading || !data) {
    return (
      <div className="p-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-border p-5 animate-pulse"
            >
              <div className="h-4 w-24 bg-surface-alt rounded mb-3" />
              <div className="h-8 w-16 bg-surface-alt rounded" />
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
          <div className="h-4 w-32 bg-surface-alt rounded mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-alt rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Overview of your patient panel
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsGrid stats={data.stats} />
      </div>

      {/* Search + Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Patients</h2>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-64"
            />
          </div>
        </div>
        <PatientTable patients={data.patients} />
      </div>
    </div>
  );
}
