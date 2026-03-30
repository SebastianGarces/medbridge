import useSWR from "swr";
import { apiGet } from "@/lib/api";
import type { Alert } from "@/lib/types";

const ALERTS_KEY = "/api/clinician/alerts";

function fetchAlerts(): Promise<{ alerts: Alert[] }> {
  return apiGet<{ alerts: Alert[] }>(ALERTS_KEY);
}

export function useAlerts(enabled = true) {
  const { data, mutate } = useSWR(
    enabled ? ALERTS_KEY : null,
    fetchAlerts,
  );

  const alerts = data?.alerts ?? [];
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return { alerts, unacknowledgedCount, mutate };
}
