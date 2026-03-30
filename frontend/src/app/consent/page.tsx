"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { apiPost } from "@/lib/api";

export default function ConsentPage() {
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiPost("/api/patient/consent", { consent });
      router.push("/chat");
    } catch (err) {
      setError("Failed to save consent. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-light flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text">
              Medbridge Health Coach Consent
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Please review and consent before using the AI coach
            </p>
          </div>

          {/* Info */}
          <div className="bg-accent-light/50 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-accent-dark mb-3">
              What the AI Health Coach does:
            </h2>
            <ul className="space-y-2.5">
              {[
                "Guides you through your home exercise program with personalized recommendations",
                "Tracks your goals and progress to keep you motivated",
                "Sends helpful reminders and check-ins for your recovery",
                "Provides exercise demonstrations and technique guidance",
                "Shares your progress with your care team for better coordination",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark flex-shrink-0 mt-0.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border mb-6">
            <div>
              <p className="text-sm font-medium text-text">
                Enable AI Health Coach
              </p>
              <p className="text-xs text-text-faint mt-0.5">
                You can change this at any time in Settings
              </p>
            </div>
            <button
              onClick={() => setConsent(!consent)}
              className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                consent ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  consent ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-critical bg-critical-light rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
