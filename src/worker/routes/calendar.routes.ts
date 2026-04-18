import type { Hono } from "hono";
import type {
	AvailabilityApiRow,
	AvailabilitySaveChange,
	AvailabilitySaveRequest,
	CalendarInfoApiRow,
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
		const result = await db
			.prepare("SELECT date, nights, priority, type FROM calendar_info WHERE user_id = ?1")
			.bind(userId)
			.all<CalendarInfoApiRow>();

		return c.json({ ok: true, rows: result.results });
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
		const statements: D1PreparedStatement[] = [];

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

			statements.push(
				db
					.prepare(
						"INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(user_id, date) DO UPDATE SET nights = excluded.nights, priority = excluded.priority, type = excluded.type"
					)
					.bind(userId, safeChange.date, safeChange.nights, safeChange.priority, safeChange.type)
			);
		}

		if (statements.length > 0) {
			await db.batch(statements);
		}

		return c.json({ ok: true, applied: payload.changes.length });
	});
}
