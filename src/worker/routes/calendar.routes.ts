import type { Hono } from "hono";
import type {
	AvailabilityApiRow,
	AvailabilitySaveChange,
	AvailabilitySaveRequest,
	CalendarInfoApiRow,
} from "../../shared/calendar.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

// Registers all calendar data endpoints behind the auth middleware.
export function registerCalendarRoutes(app: Hono<AppEnv>) {
	app.use("/api/availability", requireAuth);
	app.use("/api/availability/save", requireAuth);
	app.use("/api/calendar-info", requireAuth);

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
}
