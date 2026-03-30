"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { apiGet } from "@/lib/api";
import type { User } from "@/lib/types";

interface DemoUsers {
  patients: User[];
  clinicians: User[];
}

export default function LoginPage() {
  const [demoUsers, setDemoUsers] = useState<DemoUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace(user.type === "clinician" ? "/clinician/dashboard" : "/chat");
      return;
    }
    apiGet<DemoUsers>("/api/auth/demo-users")
      .then(setDemoUsers)
      .catch(() => {
        setError(
          "Unable to connect to the backend. Make sure the API server is running on http://localhost:8000"
        );
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleLogin = async (u: User, type: "patient" | "clinician") => {
    setLoggingIn(u.id);
    try {
      await login(u.id, type);
      router.push(type === "clinician" ? "/clinician/dashboard" : "/chat");
    } catch (err) {
      console.error("Login failed:", err);
      setLoggingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/Medbridge_logo_Color_RGB.svg" alt="Medbridge" className="h-10 mx-auto" />
          <p className="mt-2 text-text-muted text-sm">
            Select a demo user to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-critical-light border border-critical/20 rounded-xl text-sm text-critical">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Patients */}
          {demoUsers?.patients && demoUsers.patients.length > 0 && (
            <div className="p-6">
              <h2 className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">
                Patients
              </h2>
              <div className="space-y-2">
                {demoUsers.patients.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleLogin(u, "patient")}
                    disabled={loggingIn !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary-light transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{u.name}</p>
                      <p className="text-xs text-text-faint">Patient</p>
                    </div>
                    {loggingIn === u.id && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {loggingIn !== u.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {demoUsers?.patients && demoUsers.patients.length > 0 &&
            demoUsers?.clinicians && demoUsers.clinicians.length > 0 && (
              <div className="border-t border-border" />
            )}

          {/* Clinicians */}
          {demoUsers?.clinicians && demoUsers.clinicians.length > 0 && (
            <div className="p-6">
              <h2 className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">
                Clinicians
              </h2>
              <div className="space-y-2">
                {demoUsers.clinicians.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleLogin(u, "clinician")}
                    disabled={loggingIn !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-light transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{u.name}</p>
                      <p className="text-xs text-text-faint">Clinician</p>
                    </div>
                    {loggingIn === u.id && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {loggingIn !== u.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-text-faint mt-6">
          Demo environment &mdash; no real patient data
        </p>
      </div>
    </div>
  );
}
