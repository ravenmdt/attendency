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

		const userId = c.get("authUserId");

		try {
			const result = await db
				.prepare(
					`SELECT
						ci.date AS date,
						ci.nights AS nights,
						ci.priority AS priority,
						ci.type AS type,
						ci.created_at AS createdAt,
						created_by.name AS createdByName,
						COALESCE(ci.updated_at, ci.created_at) AS updatedAt,
						COALESCE(updated_by.name, created_by.name) AS updatedByName
					 FROM calendar_info ci
					 LEFT JOIN users created_by
						ON created_by.user_id = COALESCE(ci.created_by_user_id, ci.user_id)
					 LEFT JOIN users updated_by
						ON updated_by.user_id = COALESCE(ci.updated_by_user_id, ci.user_id)
					 WHERE ci.user_id = ?1
					 ORDER BY ci.date ASC`
				)
				.bind(userId)
				.all<CalendarInfoApiRow>();

			return c.json({ ok: true, rows: result.results });
		} catch {
			const fallbackResult = await db
				.prepare(
					`SELECT
						ci.date AS date,
						ci.nights AS nights,
						ci.priority AS priority,
						ci.type AS type,
						NULL AS createdAt,
						owner.name AS createdByName,
						NULL AS updatedAt,
						owner.name AS updatedByName
					 FROM calendar_info ci
					 LEFT JOIN users owner ON owner.user_id = ci.user_id
					 WHERE ci.user_id = ?1
					 ORDER BY ci.date ASC`
				)
				.bind(userId)
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

		const userId = c.get("authUserId");
		const statements: D1PreparedStatement[] = [];

		for (const change of payload.changes) {
			if (
				typeof change?.date !== "string" ||
				(change.wave !== 0 && change.wave !== 1) ||
				(change.available !== null && typeof change.available !== "boolean")
			) {
				return c.json({ ok: false, error: "Invalid change entry in payload" }, 400);
			}

			const safeChange = change as AvailabilitySaveChange;
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
		}

		if (statements.length > 0) {
			await db.batch(statements);
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
		const userId = c.get("authUserId");
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

			auditStatements.push(
				db
					.prepare(
						"INSERT INTO calendar_info (user_id, date, nights, priority, type, created_at, created_by_user_id, updated_at, updated_by_user_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?6, ?7) ON CONFLICT(user_id, date) DO UPDATE SET nights = excluded.nights, priority = excluded.priority, type = excluded.type, updated_at = excluded.updated_at, updated_by_user_id = excluded.updated_by_user_id"
					)
					.bind(
						userId,
						safeChange.date,
						safeChange.nights,
						safeChange.priority,
						safeChange.type,
						nowMs,
						userId,
					)
			);

			fallbackStatements.push(
				db
					.prepare(
						"INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(user_id, date) DO UPDATE SET nights = excluded.nights, priority = excluded.priority, type = excluded.type"
					)
					.bind(userId, safeChange.date, safeChange.nights, safeChange.priority, safeChange.type)
			);
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

		const userId = c.get("authUserId");
		const uniqueDates = [...new Set(payload.dates)];
		const statements: D1PreparedStatement[] = [];

		for (const date of uniqueDates) {
			if (typeof date !== "string" || !isValidIsoDate(date)) {
				return c.json({ ok: false, error: "Invalid date entry in payload" }, 400);
			}

			statements.push(
				db
					.prepare("DELETE FROM calendar_info WHERE user_id = ?1 AND date = ?2")
					.bind(userId, date)
			);
		}

		if (statements.length > 0) {
			await db.batch(statements);
		}

		return c.json({ ok: true, deleted: uniqueDates.length });
	});
}
