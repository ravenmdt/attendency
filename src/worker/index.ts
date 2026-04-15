import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// --- Read endpoints ---
// These let the calendar load live data from D1 instead of using hardcoded arrays.

app.get("/api/availability", async (c) => {
	// Returns all availability rows for a user so the calendar can display
	// the current persisted state on load.
	const userId = Number(c.req.query("userId"));
	if (!userId) return c.json({ ok: false, error: "Missing userId" }, 400);

	const db = c.env.DB;
	if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

	// Fetch all rows for this user; the calendar will build its baseline map from these.
	const result = await db
		.prepare("SELECT date, wave, available FROM availability WHERE user_id = ?1")
		.bind(userId)
		.all<{ date: string; wave: 0 | 1; available: 0 | 1 }>();

	return c.json({ ok: true, rows: result.results });
});

app.get("/api/calendar-info", async (c) => {
	// Returns all calendar_info rows for a user so the calendar can render
	// the day info column (nights, priority, type) from live D1 data.
	const userId = Number(c.req.query("userId"));
	if (!userId) return c.json({ ok: false, error: "Missing userId" }, 400);

	const db = c.env.DB;
	if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

	const result = await db
		.prepare("SELECT date, nights, priority, type FROM calendar_info WHERE user_id = ?1")
		.bind(userId)
		.all<{ date: string; nights: 0 | 1; priority: 0 | 1; type: string }>();

	return c.json({ ok: true, rows: result.results });
});

// --- Write endpoint ---

type AvailabilitySaveChange = {
	date: string;
	wave: 0 | 1;
	available: boolean | null;
};

type AvailabilitySavePayload = {
	// Integer user_id from the users table; replace with real auth session when users are added.
	userId: number;
	changes: AvailabilitySaveChange[];
};

app.post("/api/availability/save", async (c) => {
	// Backend wiring point:
	// Apply all UI diff rows in one request so the calendar can persist changes
	// with one logical save action.
	const payload = (await c.req.json()) as AvailabilitySavePayload;

	// Basic payload guard to avoid partial/invalid writes.
	if (!payload?.userId || !Array.isArray(payload.changes)) {
		return c.json({ ok: false, error: "Invalid payload" }, 400);
	}

	const db = c.env.DB;
	if (!db) {
		return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);
	}

	const statements: D1PreparedStatement[] = [];

	// Convert each diff row into an upsert or delete statement.
	for (const change of payload.changes) {
		if (change.available === null) {
			// available=null means "no entry" — remove the row from D1.
			statements.push(
				db
					.prepare(
						"DELETE FROM availability WHERE user_id = ?1 AND date = ?2 AND wave = ?3"
					)
					.bind(payload.userId, change.date, change.wave)
			);
		} else {
			// available=true/false — upsert so existing rows are updated in place.
			statements.push(
				db
					.prepare(
						"INSERT INTO availability (user_id, date, wave, available) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(user_id, date, wave) DO UPDATE SET available = excluded.available"
					)
					.bind(payload.userId, change.date, change.wave, change.available ? 1 : 0)
			);
		}
	}

	// Run all statements together so one request commits the full change set.
	if (statements.length > 0) {
		await db.batch(statements);
	}

	return c.json({ ok: true, applied: payload.changes.length });
});

export default app;
