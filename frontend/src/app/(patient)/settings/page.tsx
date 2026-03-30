"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

interface SettingsResponse {
  consent_given: boolean;
}

export default function SettingsPage() {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SettingsResponse>("/api/patient/settings")
      .then((data) => {
        setConsent(data.consent_given);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiPost("/api/patient/settings", { consent });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-xl font-semibold text-text mb-1">Settings</h1>
      <p className="text-sm text-text-muted mb-8">
        Manage your Medbridge Health Coach preferences
      </p>

      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        {/* Consent toggle */}
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-text">Medbridge Health Coach</p>
            <p className="text-xs text-text-muted mt-0.5">
              Enable or disable AI-powered coaching for your exercise program
            </p>
          </div>
          <button
            onClick={() => setConsent(!consent)}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
              consent ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                consent ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-critical bg-critical-light rounded-lg px-4 py-3 mt-4">
          {error}
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="text-sm text-success bg-success-light rounded-lg px-4 py-3 mt-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Settings saved successfully
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
