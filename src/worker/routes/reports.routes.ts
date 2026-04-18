import type { Hono } from "hono";
import type { ReportAvailabilityApiRow } from "../../shared/reports.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";
import { mapStoredImageUrlForClient } from "./userImage.utils";

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
}
