import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import type { CalendarInfoItem } from "../Calendar/calendar.types";
import type {
  ApiResponse,
  CalendarInfoApiRow,
} from "../../../shared/calendar.types";
import type {
  ReportsChangeFeedMutationResponse,
  ReportsChangeFeedResponse,
  ReportsMonthResponse,
} from "../../../shared/reports.types";
import { buildReportsAvailabilityMap, getMonthKey } from "./reports.utils";
import type {
  AttendanceChangeFeedItem,
  ReportMonthQueryResult,
} from "./reports.types";

export function useReportsData(visibleMonth: Date): ReportMonthQueryResult {
  const { authenticatedFetch, currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarInfoLoading, setIsCalendarInfoLoading] = useState(true);
  const [isChangeFeedLoading, setIsChangeFeedLoading] = useState(true);
  const [error, setError] = useState("");
  const [changeFeedError, setChangeFeedError] = useState("");
  const [changeFeedCutoffDays, setChangeFeedCutoffDays] = useState(13);
  const [availabilityByDate, setAvailabilityByDate] = useState(() => new Map());
  const [calendarInfoByDate, setCalendarInfoByDate] = useState(() => new Map());
  const [changeFeedItems, setChangeFeedItems] = useState<
    AttendanceChangeFeedItem[]
  >([]);
  const [acceptingChangeId, setAcceptingChangeId] = useState<number | null>(
    null,
  );
  const [deletingChangeId, setDeletingChangeId] = useState<number | null>(null);

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

  const loadChangeFeed = useCallback(async () => {
    try {
      setIsChangeFeedLoading(true);
      setChangeFeedError("");

      const response = await authenticatedFetch("/api/reports/change-feed");
      const body = (await response.json().catch(() => null)) as
        | ReportsChangeFeedResponse
        | null;

      if (!response.ok || !body?.ok) {
        setChangeFeedItems([]);
        setChangeFeedError(
          body && !body.ok
            ? body.error
            : "Failed to load the attendance change feed",
        );
        return;
      }

      setChangeFeedCutoffDays(body.cutoffDays);
      setChangeFeedItems(body.items);
    } catch {
      setChangeFeedItems([]);
      setChangeFeedError(
        "Network error while loading the attendance change feed",
      );
    } finally {
      setIsChangeFeedLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    void loadChangeFeed();
  }, [loadChangeFeed]);

  async function handleAcceptChange(changeId: number) {
    try {
      setAcceptingChangeId(changeId);

      const response = await authenticatedFetch(
        `/api/reports/change-feed/${changeId}/accept`,
        {
          method: "PATCH",
        },
      );
      const body = (await response.json().catch(() => null)) as
        | ReportsChangeFeedMutationResponse
        | null;

      if (!response.ok || !body?.ok) {
        setChangeFeedError(
          body && !body.ok
            ? body.error
            : "Failed to accept the attendance change",
        );
        return;
      }

      setChangeFeedItems((previousItems) =>
        previousItems.map((item) =>
          item.changeId === changeId ? { ...item, accepted: true } : item,
        ),
      );
    } catch {
      setChangeFeedError("Network error while accepting the attendance change");
    } finally {
      setAcceptingChangeId(null);
    }
  }

  async function handleDeleteChange(changeId: number) {
    try {
      setDeletingChangeId(changeId);

      const response = await authenticatedFetch(
        `/api/reports/change-feed/${changeId}`,
        {
          method: "DELETE",
        },
      );
      const body = (await response.json().catch(() => null)) as
        | ReportsChangeFeedMutationResponse
        | null;

      if (!response.ok || !body?.ok) {
        setChangeFeedError(
          body && !body.ok
            ? body.error
            : "Failed to delete the attendance change",
        );
        return;
      }

      setChangeFeedItems((previousItems) =>
        previousItems.filter((item) => item.changeId !== changeId),
      );
    } catch {
      setChangeFeedError("Network error while deleting the attendance change");
    } finally {
      setDeletingChangeId(null);
    }
  }

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

  const canManageChangeFeed =
    currentUser?.role === "Admin" || currentUser?.role === "Admin Assistant";

  return {
    isLoading,
    isCalendarInfoLoading,
    isChangeFeedLoading,
    error,
    changeFeedError,
    changeFeedCutoffDays,
    canManageChangeFeed,
    acceptingChangeId,
    deletingChangeId,
    availabilityByDate,
    calendarInfoByDate,
    changeFeedItems,
    handleAcceptChange,
    handleDeleteChange,
  };
}
