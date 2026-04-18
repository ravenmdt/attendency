import type { Hono } from "hono";
import type {
  AttendanceChangeFeedItem,
  ReportAvailabilityApiRow,
  ReportsChangeFeedMutationResponse,
} from "../../shared/reports.types";
import type { UserRole } from "../../shared/users.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";
import { mapStoredImageUrlForClient } from "./userImage.utils";

const DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS = 13;
const MAX_ATTENDANCE_FEED_CUTOFF_DAYS = 21;

type ReportChangeFeedApiRow = {
  changeId: number;
  subjectUserId: number;
  subjectUserName: string;
  subjectUserImageUrl: string | null;
  actorUserId: number | null;
  actorUserName: string | null;
  date: string;
  wave: number;
  previousAvailable: number | null;
  nextAvailable: number | null;
  action: "created" | "updated" | "cleared";
  accepted: number;
  createdAt: number;
};

function parsePositiveInt(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

function canManageAttendanceChangeFeed(userRole: UserRole): boolean {
  return userRole === "Admin" || userRole === "Admin Assistant";
}

function toMonthDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseMonthRange(monthKey: string) {
  const [rawYear, rawMonth] = monthKey.split("-");
  const year = Number.parseInt(rawYear, 10);
  const monthIndex = Number.parseInt(rawMonth, 10) - 1;

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);

  return {
    startDate: toMonthDateKey(start),
    endDate: toMonthDateKey(end),
  };
}

function clampCutoffDays(value: number): number {
  return Math.min(MAX_ATTENDANCE_FEED_CUTOFF_DAYS, Math.max(1, Math.trunc(value)));
}

async function getAttendanceFeedCutoffDays(db: D1Database): Promise<number> {
  try {
    const row = await db
      .prepare(
        `SELECT attendance_feed_cutoff_days AS cutoffDays
         FROM admin_settings
         WHERE settings_id = 1`
      )
      .first<{ cutoffDays: number | null }>();

    if (row?.cutoffDays === null || row?.cutoffDays === undefined) {
      return DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS;
    }

    return clampCutoffDays(Number(row.cutoffDays));
  } catch {
    // Fall back cleanly so older databases still keep Reports working.
    return DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS;
  }
}

async function pruneExpiredAttendanceFeedRows(
  db: D1Database,
  cutoffDays: number,
) {
  const todayDateKey = toMonthDateKey(new Date());
  const maxVisibleDate = new Date();
  maxVisibleDate.setDate(maxVisibleDate.getDate() + cutoffDays);
  const maxVisibleDateKey = toMonthDateKey(maxVisibleDate);

  try {
    await db
      .prepare(
        `DELETE FROM attendance_change_feed
         WHERE date < ?1 OR date > ?2 OR expires_at < ?3`
      )
      .bind(todayDateKey, maxVisibleDateKey, Date.now())
      .run();
  } catch {
    // Ignore missing-table errors before the migration has been applied.
  }
}

export function registerReportsRoutes(app: Hono<AppEnv>) {
  app.use("/api/reports", requireAuth);
  app.use("/api/reports/*", requireAuth);

  app.get("/api/reports/month", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);
    }

    const monthKey = c.req.query("month");
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return c.json({ ok: false, error: "Query parameter 'month' must use YYYY-MM format" }, 400);
    }

    const { startDate, endDate } = parseMonthRange(monthKey);

    const result = await db
      .prepare(
        `SELECT
          a.date AS date,
          a.wave AS wave,
          a.available AS available,
          u.user_id AS userId,
          u.name AS name,
          u.qualification AS qualification,
          u.image_url AS imageUrl,
          -- Include special_instructions so the Reports panel can show a tooltip.
          u.special_instructions AS specialInstructions
        FROM availability a
        INNER JOIN users u ON u.user_id = a.user_id
        WHERE a.date >= ?1
          AND a.date < ?2
        ORDER BY a.date ASC, a.wave ASC, LOWER(u.name) ASC`
      )
      .bind(startDate, endDate)
      .all<ReportAvailabilityApiRow & { imageUrl: string | null }>();

    const rows: ReportAvailabilityApiRow[] = result.results.map((row) => ({
      ...row,
      userId: Number(row.userId),
      wave: Number(row.wave) as 0 | 1,
      available: Number(row.available) as 0 | 1,
      imageUrl: mapStoredImageUrlForClient(Number(row.userId), row.imageUrl),
    }));

    return c.json({ ok: true, month: monthKey, rows });
  });

  app.get("/api/reports/change-feed", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);
    }

    const cutoffDays = await getAttendanceFeedCutoffDays(db);
    await pruneExpiredAttendanceFeedRows(db, cutoffDays);

    const startDate = toMonthDateKey(new Date());
    const endDateValue = new Date();
    endDateValue.setDate(endDateValue.getDate() + cutoffDays);
    const endDate = toMonthDateKey(endDateValue);

    try {
      const result = await db
        .prepare(
          `SELECT
             f.change_id AS changeId,
             f.subject_user_id AS subjectUserId,
             subject_user.name AS subjectUserName,
             subject_user.image_url AS subjectUserImageUrl,
             f.actor_user_id AS actorUserId,
             actor_user.name AS actorUserName,
             f.date AS date,
             f.wave AS wave,
             f.previous_available AS previousAvailable,
             f.next_available AS nextAvailable,
             f.action AS action,
             f.accepted AS accepted,
             f.created_at AS createdAt
           FROM attendance_change_feed f
           INNER JOIN users subject_user ON subject_user.user_id = f.subject_user_id
           LEFT JOIN users actor_user ON actor_user.user_id = f.actor_user_id
           WHERE f.date >= ?1
             AND f.date <= ?2
           ORDER BY
             f.date ASC,
             LOWER(COALESCE(actor_user.name, subject_user.name)) ASC,
             LOWER(subject_user.name) ASC,
             f.wave ASC,
             f.created_at ASC,
             f.change_id ASC
           LIMIT 100`
        )
        .bind(startDate, endDate)
        .all<ReportChangeFeedApiRow>();

      const items: AttendanceChangeFeedItem[] = result.results.map((row) => ({
        changeId: Number(row.changeId),
        subjectUserId: Number(row.subjectUserId),
        subjectUserName: row.subjectUserName,
        subjectUserImageUrl: mapStoredImageUrlForClient(
          Number(row.subjectUserId),
          row.subjectUserImageUrl,
        ),
        actorUserId:
          row.actorUserId === null || row.actorUserId === undefined
            ? null
            : Number(row.actorUserId),
        actorUserName: row.actorUserName ?? null,
        date: row.date,
        wave: Number(row.wave) as 0 | 1,
        previousAvailable:
          row.previousAvailable === null || row.previousAvailable === undefined
            ? null
            : (Number(row.previousAvailable) as 0 | 1),
        nextAvailable:
          row.nextAvailable === null || row.nextAvailable === undefined
            ? null
            : (Number(row.nextAvailable) as 0 | 1),
        action: row.action,
        accepted: Boolean(row.accepted),
        createdAt: Number(row.createdAt),
      }));

      return c.json({ ok: true, cutoffDays, items });
    } catch {
      // If the migration has not been applied yet, keep the page usable and show
      // an empty feed instead of failing the full Reports screen.
      return c.json({ ok: true, cutoffDays, items: [] });
    }
  });

  app.patch("/api/reports/change-feed/:id/accept", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "D1 binding DB is not configured" },
        500,
      );
    }

    if (!canManageAttendanceChangeFeed(c.get("authUserRole"))) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Forbidden" },
        403,
      );
    }

    const changeId = parsePositiveInt(c.req.param("id"));
    if (!changeId) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Invalid change ID" },
        400,
      );
    }

    const result = await db
      .prepare("UPDATE attendance_change_feed SET accepted = 1 WHERE change_id = ?1")
      .bind(changeId)
      .run();

    if (result.meta.changes === 0) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Attendance change not found" },
        404,
      );
    }

    return c.json<ReportsChangeFeedMutationResponse>({ ok: true });
  });

  app.delete("/api/reports/change-feed/:id", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "D1 binding DB is not configured" },
        500,
      );
    }

    if (!canManageAttendanceChangeFeed(c.get("authUserRole"))) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Forbidden" },
        403,
      );
    }

    const changeId = parsePositiveInt(c.req.param("id"));
    if (!changeId) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Invalid change ID" },
        400,
      );
    }

    const result = await db
      .prepare("DELETE FROM attendance_change_feed WHERE change_id = ?1")
      .bind(changeId)
      .run();

    if (result.meta.changes === 0) {
      return c.json<ReportsChangeFeedMutationResponse>(
        { ok: false, error: "Attendance change not found" },
        404,
      );
    }

    return c.json<ReportsChangeFeedMutationResponse>({ ok: true });
  });
}
