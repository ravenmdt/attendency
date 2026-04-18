import type { Hono } from "hono";
import type {
	AvailabilityApiRow,
	AvailabilitySaveChange,
	AvailabilitySaveRequest,
	CalendarInfoApiRow,
	CalendarInfoDeleteRequest,
	CalendarInfoSaveChange,
	CalendarInfoSaveRequest,
	CalendarInfoType,
} from "../../shared/calendar.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

type ExistingAvailabilityRow = {
	available: number;
};

type AvailabilityAuditAction = "created" | "updated" | "cleared";

const DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS = 13;
const MAX_ATTENDANCE_FEED_CUTOFF_DAYS = 21;

function isValidIsoDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split("-").map(Number);
	const parsed = new Date(Date.UTC(year, month - 1, day));

	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() === month - 1 &&
		parsed.getUTCDate() === day
	);
}

function toIsoDateKey(value: Date): string {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getExpiryMsForAffectedDate(isoDate: string): number {
	const [year, month, day] = isoDate.split("-").map(Number);
	return Date.UTC(year, month - 1, day + 1);
}

function clampAttendanceFeedCutoffDays(value: number | null | undefined) {
	if (value === null || value === undefined || Number.isNaN(Number(value))) {
		return DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS;
	}

	return Math.min(MAX_ATTENDANCE_FEED_CUTOFF_DAYS, Math.max(1, Math.trunc(Number(value))));
}

async function getAttendanceFeedCutoffDays(db: D1Database) {
	try {
		const row = await db
			.prepare(
				`SELECT attendance_feed_cutoff_days AS cutoffDays
				 FROM admin_settings
				 WHERE settings_id = 1`
			)
			.first<{ cutoffDays: number | null }>();

		return clampAttendanceFeedCutoffDays(row?.cutoffDays);
	} catch {
		return DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS;
	}
}

function isDateWithinFeedWindow(isoDate: string, cutoffDays: number) {
	const todayDateKey = toIsoDateKey(new Date());
	const maxVisibleDate = new Date();
	maxVisibleDate.setDate(maxVisibleDate.getDate() + cutoffDays);
	const maxVisibleDateKey = toIsoDateKey(maxVisibleDate);

	return isoDate >= todayDateKey && isoDate <= maxVisibleDateKey;
}

async function pruneExpiredAttendanceFeedRows(db: D1Database, cutoffDays: number) {
	const todayDateKey = toIsoDateKey(new Date());
	const maxVisibleDate = new Date();
	maxVisibleDate.setDate(maxVisibleDate.getDate() + cutoffDays);
	const maxVisibleDateKey = toIsoDateKey(maxVisibleDate);

	try {
		// Cleanup happens opportunistically during reads and writes so the feed stays
		// relevant without needing a separate scheduled worker job.
		await db
			.prepare(
				`DELETE FROM attendance_change_feed
				 WHERE date < ?1 OR date > ?2 OR expires_at < ?3`
			)
			.bind(todayDateKey, maxVisibleDateKey, Date.now())
			.run();
	} catch {
		// Older databases may not have the feed table yet; availability saves should
		// still succeed even before the migration has been applied.
	}
}

// Registers all calendar data endpoints behind the auth middleware.
export function registerCalendarRoutes(app: Hono<AppEnv>) {
	app.use("/api/availability", requireAuth);
	app.use("/api/availability/save", requireAuth);
	app.use("/api/calendar-info", requireAuth);
	app.use("/api/calendar-info/delete", requireAuth);
	app.use("/api/calendar-info/save", requireAuth);

	app.get("/api/availability", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const userId = c.get("authUserId");
		const result = await db
			.prepare("SELECT date, wave, available FROM availability WHERE user_id = ?1")
			.bind(userId)
			.all<AvailabilityApiRow>();

		return c.json({ ok: true, rows: result.results });
	});

	app.get("/api/calendar-info", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		try {
			const result = await db
				.prepare(
					`WITH shared_info AS (
						SELECT
							ci.*,
							ROW_NUMBER() OVER (
								PARTITION BY ci.date
								ORDER BY COALESCE(ci.updated_at, ci.created_at, 0) DESC, ci.user_id ASC
							) AS row_number
						FROM calendar_info ci
					)
					SELECT
						ci.date AS date,
						ci.nights AS nights,
						ci.priority AS priority,
						ci.type AS type,
						ci.created_at AS createdAt,
						created_by.name AS createdByName,
						COALESCE(ci.updated_at, ci.created_at) AS updatedAt,
						COALESCE(updated_by.name, created_by.name) AS updatedByName
					FROM shared_info ci
					LEFT JOIN users created_by
						ON created_by.user_id = COALESCE(ci.created_by_user_id, ci.user_id)
					LEFT JOIN users updated_by
						ON updated_by.user_id = COALESCE(ci.updated_by_user_id, ci.user_id)
					WHERE ci.row_number = 1
					ORDER BY ci.date ASC`
				)
				.all<CalendarInfoApiRow>();

			return c.json({ ok: true, rows: result.results });
		} catch {
			const fallbackResult = await db
				.prepare(
					`WITH shared_info AS (
						SELECT
							ci.*,
							ROW_NUMBER() OVER (
								PARTITION BY ci.date
								ORDER BY ci.user_id ASC
							) AS row_number
						FROM calendar_info ci
					)
					SELECT
						ci.date AS date,
						ci.nights AS nights,
						ci.priority AS priority,
						ci.type AS type,
						NULL AS createdAt,
						owner.name AS createdByName,
						NULL AS updatedAt,
						owner.name AS updatedByName
					FROM shared_info ci
					LEFT JOIN users owner ON owner.user_id = ci.user_id
					WHERE ci.row_number = 1
					ORDER BY ci.date ASC`
				)
				.all<CalendarInfoApiRow>();

			return c.json({ ok: true, rows: fallbackResult.results });
		}
	});

	app.post("/api/availability/save", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		let payload: AvailabilitySaveRequest;
		try {
			payload = (await c.req.json()) as AvailabilitySaveRequest;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!Array.isArray(payload.changes)) {
			return c.json({ ok: false, error: "Invalid payload: changes must be an array" }, 400);
		}

		if (payload.changes.length > 100) {
			return c.json({ ok: false, error: "Maximum 100 changes are allowed per request" }, 400);
		}

		const userId = c.get("authUserId");
		const statements: D1PreparedStatement[] = [];
		const feedStatements: D1PreparedStatement[] = [];
		const cutoffDays = await getAttendanceFeedCutoffDays(db);

		await pruneExpiredAttendanceFeedRows(db, cutoffDays);

		for (const change of payload.changes) {
			if (
				typeof change?.date !== "string" ||
				!isValidIsoDate(change.date) ||
				(change.wave !== 0 && change.wave !== 1) ||
				(change.available !== null && typeof change.available !== "boolean")
			) {
				return c.json({ ok: false, error: "Invalid change entry in payload" }, 400);
			}

			const safeChange = change as AvailabilitySaveChange;
			const existingRow = await db
				.prepare(
					"SELECT available AS available FROM availability WHERE user_id = ?1 AND date = ?2 AND wave = ?3 LIMIT 1"
				)
				.bind(userId, safeChange.date, safeChange.wave)
				.first<ExistingAvailabilityRow>();

			const previousAvailable =
				existingRow?.available === undefined || existingRow.available === null
					? null
					: Number(existingRow.available);
			const nextAvailable =
				safeChange.available === null ? null : safeChange.available ? 1 : 0;

			if (safeChange.available === null) {
				statements.push(
					db
						.prepare("DELETE FROM availability WHERE user_id = ?1 AND date = ?2 AND wave = ?3")
						.bind(userId, safeChange.date, safeChange.wave)
				);
			} else {
				statements.push(
					db
						.prepare(
							"INSERT INTO availability (user_id, date, wave, available) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(user_id, date, wave) DO UPDATE SET available = excluded.available"
						)
						.bind(userId, safeChange.date, safeChange.wave, safeChange.available ? 1 : 0)
				);
			}

			// Only add a feed row when the persisted value actually changes. This keeps
			// the audit list readable instead of logging duplicate no-op saves.
			if (
				previousAvailable !== nextAvailable &&
				isDateWithinFeedWindow(safeChange.date, cutoffDays)
			) {
				const action: AvailabilityAuditAction =
					safeChange.available === null
						? "cleared"
						: previousAvailable === null
							? "created"
							: "updated";
				const nowMs = Date.now();

				feedStatements.push(
					db
						.prepare(
							`INSERT INTO attendance_change_feed (
								subject_user_id,
								actor_user_id,
								date,
								wave,
								previous_available,
								next_available,
								action,
								created_at,
								expires_at
							) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
						)
						.bind(
							userId,
							userId,
							safeChange.date,
							safeChange.wave,
							previousAvailable,
							nextAvailable,
							action,
							nowMs,
							getExpiryMsForAffectedDate(safeChange.date),
						)
				);
			}
		}

		if (statements.length > 0) {
			await db.batch(statements);
		}

		if (feedStatements.length > 0) {
			try {
				await db.batch(feedStatements);
			} catch (error) {
				console.error("Failed to write attendance change feed rows:", error);
			}
		}

		return c.json({ ok: true, applied: payload.changes.length });
	});

	app.post("/api/calendar-info/save", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can update calendar info" }, 403);
		}

		let payload: CalendarInfoSaveRequest;
		try {
			payload = (await c.req.json()) as CalendarInfoSaveRequest;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!Array.isArray(payload.changes)) {
			return c.json({ ok: false, error: "Invalid payload: changes must be an array" }, 400);
		}

		if (payload.changes.length > 100) {
			return c.json({ ok: false, error: "Maximum 100 changes are allowed per request" }, 400);
		}

		const allowedTypes = new Set<CalendarInfoType>(["PTT", "ACT"]);
		const actorUserId = c.get("authUserId");
		const nowMs = Date.now();
		const auditStatements: D1PreparedStatement[] = [];
		const fallbackStatements: D1PreparedStatement[] = [];

		for (const change of payload.changes) {
			if (
				typeof change?.date !== "string" ||
				!isValidIsoDate(change.date) ||
				(change.nights !== 0 && change.nights !== 1) ||
				(change.priority !== 0 && change.priority !== 1) ||
				typeof change.type !== "string"
			) {
				return c.json({ ok: false, error: "Invalid change entry in payload" }, 400);
			}

			const normalizedType = change.type.toUpperCase() as CalendarInfoType;
			if (!allowedTypes.has(normalizedType)) {
				return c.json({ ok: false, error: "Invalid type value. Allowed values: PTT, ACT" }, 400);
			}

			const safeChange: CalendarInfoSaveChange = {
				date: change.date,
				nights: change.nights,
				priority: change.priority,
				type: normalizedType,
			};

			const existingRow = await db
				.prepare(
					"SELECT user_id AS userId FROM calendar_info WHERE date = ?1 ORDER BY user_id ASC LIMIT 1"
				)
				.bind(safeChange.date)
				.first<{ userId: number }>();

			const ownerUserId = existingRow?.userId ?? actorUserId;

			auditStatements.push(
				db.prepare("DELETE FROM calendar_info WHERE date = ?1 AND user_id <> ?2").bind(safeChange.date, ownerUserId)
			);
			fallbackStatements.push(
				db.prepare("DELETE FROM calendar_info WHERE date = ?1 AND user_id <> ?2").bind(safeChange.date, ownerUserId)
			);

			if (existingRow) {
				auditStatements.push(
					db
						.prepare(
							"UPDATE calendar_info SET nights = ?1, priority = ?2, type = ?3, updated_at = ?4, updated_by_user_id = ?5 WHERE user_id = ?6 AND date = ?7"
						)
						.bind(
							safeChange.nights,
							safeChange.priority,
							safeChange.type,
							nowMs,
							actorUserId,
							ownerUserId,
							safeChange.date,
						)
				);

				fallbackStatements.push(
					db
						.prepare(
							"UPDATE calendar_info SET nights = ?1, priority = ?2, type = ?3 WHERE user_id = ?4 AND date = ?5"
						)
						.bind(
							safeChange.nights,
							safeChange.priority,
							safeChange.type,
							ownerUserId,
							safeChange.date,
						)
				);
			} else {
				auditStatements.push(
					db
						.prepare(
							"INSERT INTO calendar_info (user_id, date, nights, priority, type, created_at, created_by_user_id, updated_at, updated_by_user_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?6, ?7)"
						)
						.bind(
							actorUserId,
							safeChange.date,
							safeChange.nights,
							safeChange.priority,
							safeChange.type,
							nowMs,
							actorUserId,
						)
				);

				fallbackStatements.push(
					db
						.prepare("INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (?1, ?2, ?3, ?4, ?5)")
						.bind(
							actorUserId,
							safeChange.date,
							safeChange.nights,
							safeChange.priority,
							safeChange.type,
						)
				);
			}
		}

		if (auditStatements.length > 0) {
			try {
				await db.batch(auditStatements);
			} catch {
				await db.batch(fallbackStatements);
			}
		}

		return c.json({ ok: true, applied: payload.changes.length });
	});

	app.post("/api/calendar-info/delete", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can delete calendar info" }, 403);
		}

		let payload: CalendarInfoDeleteRequest;
		try {
			payload = (await c.req.json()) as CalendarInfoDeleteRequest;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!Array.isArray(payload.dates)) {
			return c.json({ ok: false, error: "Invalid payload: dates must be an array" }, 400);
		}

		if (payload.dates.length > 100) {
			return c.json({ ok: false, error: "Maximum 100 dates are allowed per request" }, 400);
		}

		const uniqueDates = [...new Set(payload.dates)];
		const statements: D1PreparedStatement[] = [];

		for (const date of uniqueDates) {
			if (typeof date !== "string" || !isValidIsoDate(date)) {
				return c.json({ ok: false, error: "Invalid date entry in payload" }, 400);
			}

			statements.push(db.prepare("DELETE FROM calendar_info WHERE date = ?1").bind(date));
		}

		if (statements.length > 0) {
			await db.batch(statements);
		}

		return c.json({ ok: true, deleted: uniqueDates.length });
	});
}
