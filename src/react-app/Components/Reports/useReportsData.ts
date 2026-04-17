import { useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import type { ReportsMonthResponse } from "../../../shared/reports.types";
import { buildReportsAvailabilityMap, getMonthKey } from "./reports.utils";
import type { ReportMonthQueryResult } from "./reports.types";

export function useReportsData(visibleMonth: Date): ReportMonthQueryResult {
  const { authenticatedFetch } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [availabilityByDate, setAvailabilityByDate] = useState(() => new Map());

  useEffect(() => {
    const monthKey = getMonthKey(visibleMonth);

    async function loadMonthReport() {
      try {
        setIsLoading(true);
        setError("");

        const response = await authenticatedFetch(
          `/api/reports/month?month=${encodeURIComponent(monthKey)}`,
        );
        const body = (await response.json().catch(() => null)) as ReportsMonthResponse | null;

        if (!response.ok || !body?.ok) {
          setAvailabilityByDate(new Map());
          setError(body && !body.ok ? body.error : "Failed to load report data");
          return;
        }

        setAvailabilityByDate(buildReportsAvailabilityMap(body.rows));
      } catch {
        setAvailabilityByDate(new Map());
        setError("Network error while loading the reports page");
      } finally {
        setIsLoading(false);
      }
    }

    void loadMonthReport();
  }, [authenticatedFetch, visibleMonth]);

  return {
    isLoading,
    error,
    availabilityByDate,
  };
}
