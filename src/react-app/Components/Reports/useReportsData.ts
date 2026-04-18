import { useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import type { CalendarInfoItem } from "../Calendar/calendar.types";
import type {
  ApiResponse,
  CalendarInfoApiRow,
} from "../../../shared/calendar.types";
import type { ReportsMonthResponse } from "../../../shared/reports.types";
import { buildReportsAvailabilityMap, getMonthKey } from "./reports.utils";
import type { ReportMonthQueryResult } from "./reports.types";

export function useReportsData(visibleMonth: Date): ReportMonthQueryResult {
  const { authenticatedFetch } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarInfoLoading, setIsCalendarInfoLoading] = useState(true);
  const [error, setError] = useState("");
  const [availabilityByDate, setAvailabilityByDate] = useState(() => new Map());
  const [calendarInfoByDate, setCalendarInfoByDate] = useState(() => new Map());

  useEffect(() => {
    async function loadCalendarInfo() {
      try {
        setIsCalendarInfoLoading(true);

        const response = await authenticatedFetch("/api/calendar-info");
        const body = (await response.json().catch(() => null)) as
          | ApiResponse<CalendarInfoApiRow>
          | null;

        if (!response.ok || !body?.ok) {
          setCalendarInfoByDate(new Map());
          return;
        }

        const infoMap = new Map<string, CalendarInfoItem>();
        for (const row of body.rows) {
          infoMap.set(row.date, {
            date: row.date,
            nights: Boolean(row.nights),
            priority: Boolean(row.priority),
            type: row.type,
            createdAt: row.createdAt === null ? null : Number(row.createdAt),
            createdByName: row.createdByName ?? null,
            updatedAt: row.updatedAt === null ? null : Number(row.updatedAt),
            updatedByName: row.updatedByName ?? null,
          });
        }

        setCalendarInfoByDate(infoMap);
      } catch {
        setCalendarInfoByDate(new Map());
      } finally {
        setIsCalendarInfoLoading(false);
      }
    }

    void loadCalendarInfo();
  }, [authenticatedFetch]);

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
    isCalendarInfoLoading,
    error,
    availabilityByDate,
    calendarInfoByDate,
  };
}
