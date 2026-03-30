"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import PatientSidebar from "@/components/patient/PatientSidebar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.type !== "patient") {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.type !== "patient") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PatientSidebar />
      <main className="flex-1 overflow-auto bg-surface">
        {children}
      </main>
    </div>
  );
}
