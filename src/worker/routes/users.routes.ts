import type { Hono } from "hono";
import type { UserListApiRow } from "../../shared/users.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

type UserListDbRow = {
	id: number;
	name: string;
	qualification: UserListApiRow["qualification"];
	role: UserListApiRow["role"];
	imageUrl: string | null;
	lastLoginAt: number | null;
	isOnline: number;
};

// Registers the authenticated user-list endpoint.
export function registerUserRoutes(app: Hono<AppEnv>) {
	app.use("/api/users", requireAuth);

	app.get("/api/users", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const nowMs = Date.now();
		const currentUserId = c.get("authUserId");
		const result = await db
			.prepare(
				`SELECT
					u.user_id AS id,
					u.name AS name,
					u.qualification AS qualification,
					u.role AS role,
					u.image_url AS imageUrl,
					u.last_login_at AS lastLoginAt,
					CASE
						WHEN EXISTS (
							SELECT 1
							FROM sessions s
							WHERE s.user_id = u.user_id AND s.expires_at > ?1
						) THEN 1
						ELSE 0
					END AS isOnline
				FROM users u
				ORDER BY CASE WHEN u.user_id = ?2 THEN 0 ELSE 1 END, LOWER(u.name) ASC`
			)
			.bind(nowMs, currentUserId)
			.all<UserListDbRow>();

		const rows: UserListApiRow[] = result.results.map((row) => ({
			id: Number(row.id),
			name: row.name,
			qualification: row.qualification,
			role: row.role,
			imageUrl: row.imageUrl,
			lastLoginAt: row.lastLoginAt === null ? null : Number(row.lastLoginAt),
			isOnline: Boolean(row.isOnline),
		}));

		return c.json({ ok: true, rows });
	});
}
