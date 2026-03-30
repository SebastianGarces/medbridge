"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import ClinicianSidebar from "@/components/clinician/ClinicianSidebar";
import { useAlerts } from "@/lib/useAlerts";

export default function ClinicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { unacknowledgedCount } = useAlerts(user?.type === "clinician");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.type !== "clinician") {
      router.replace("/");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.type !== "clinician") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <ClinicianSidebar alertCount={unacknowledgedCount} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
