import type { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import { getAdminSettingsRow } from "./admin.routes";
import type {
	UserCreateRequest,
	UserDetailApiRow,
	UserListApiRow,
	UserQualification,
	UserRole,
	UserUpdateRequest,
} from "../../shared/users.types";
import { SESSION_COOKIE_NAME, isValidUsername } from "../auth/security";
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

const USER_QUALIFICATIONS: UserQualification[] = ["NONE", "PTT", "ACT", "PTT TO ACT"];
const USER_ROLES: UserRole[] = ["User", "Admin"];

function parseUserId(rawValue: string): number | null {
	const userId = Number.parseInt(rawValue, 10);
	if (!Number.isInteger(userId) || userId <= 0) return null;
	return userId;
}

function mapUserRow(row: UserListDbRow): UserDetailApiRow {
	return {
		id: Number(row.id),
		name: row.name,
		qualification: row.qualification,
		role: row.role,
		imageUrl: row.imageUrl,
		lastLoginAt: row.lastLoginAt === null ? null : Number(row.lastLoginAt),
		isOnline: Boolean(row.isOnline),
	};
}

async function getUserById(db: D1Database, userId: number, nowMs: number) {
	return db
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
			WHERE u.user_id = ?2`
		)
		.bind(nowMs, userId)
		.first<UserListDbRow>();
}

// Registers the authenticated user-list endpoint.
export function registerUserRoutes(app: Hono<AppEnv>) {
	app.use("/api/users", requireAuth);
	app.use("/api/users/*", requireAuth);

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

		const rows: UserListApiRow[] = result.results.map(mapUserRow);

		return c.json({ ok: true, rows });
	});

	app.post("/api/users", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		// Creating users changes project data, so it is limited to Admin users.
		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can create users" }, 403);
		}

		let payload: Partial<UserCreateRequest>;
		try {
			payload = (await c.req.json()) as Partial<UserCreateRequest>;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!isValidUsername(payload.name)) {
			return c.json({ ok: false, error: "Invalid username format" }, 400);
		}
		if (!payload.qualification || !USER_QUALIFICATIONS.includes(payload.qualification)) {
			return c.json({ ok: false, error: "Invalid qualification" }, 400);
		}
		if (!payload.role || !USER_ROLES.includes(payload.role)) {
			return c.json({ ok: false, error: "Invalid role" }, 400);
		}
		const normalizedName = payload.name.trim();
		const adminSettings = await getAdminSettingsRow(db);

		let insertedUserId: number | null = null;
		try {
			const result = await db
				.prepare(
					`INSERT INTO users (
						name,
						password_hash,
						password_salt,
						password_iterations,
						password_algo,
						qualification,
						role,
						image_url,
						last_login_at
					) VALUES (?1, ?2, ?3, ?4, 'pbkdf2-sha256', ?5, ?6, NULL, NULL)`
				)
				.bind(
					normalizedName,
					adminSettings.default_password_hash,
					adminSettings.default_password_salt,
					adminSettings.default_password_iterations,
					payload.qualification,
					payload.role
				)
				.run();

			insertedUserId = Number(result.meta.last_row_id);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to create user";
			if (message.toLowerCase().includes("unique")) {
				return c.json({ ok: false, error: "Username already exists" }, 409);
			}
			return c.json({ ok: false, error: "Failed to create user" }, 500);
		}

		if (!insertedUserId || !Number.isInteger(insertedUserId)) {
			return c.json({ ok: false, error: "Failed to create user" }, 500);
		}

		const createdRow = await getUserById(db, insertedUserId, Date.now());
		if (!createdRow) {
			return c.json({ ok: false, error: "Failed to load created user" }, 500);
		}

		return c.json({ ok: true, user: mapUserRow(createdRow) });
	});

	app.get("/api/users/:id", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		// The detailed editor view is reserved for Admin users.
		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can view the edit form" }, 403);
		}

		const userId = parseUserId(c.req.param("id"));
		if (userId === null) {
			return c.json({ ok: false, error: "Invalid user id" }, 400);
		}

		const row = await getUserById(db, userId, Date.now());
		if (!row) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		return c.json({ ok: true, user: mapUserRow(row) });
	});

	app.post("/api/users/:id", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can edit users" }, 403);
		}

		const userId = parseUserId(c.req.param("id"));
		if (userId === null) {
			return c.json({ ok: false, error: "Invalid user id" }, 400);
		}

		let payload: Partial<UserUpdateRequest>;
		try {
			payload = (await c.req.json()) as Partial<UserUpdateRequest>;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!isValidUsername(payload.name)) {
			return c.json({ ok: false, error: "Invalid username format" }, 400);
		}
		if (!payload.qualification || !USER_QUALIFICATIONS.includes(payload.qualification)) {
			return c.json({ ok: false, error: "Invalid qualification" }, 400);
		}
		if (!payload.role || !USER_ROLES.includes(payload.role)) {
			return c.json({ ok: false, error: "Invalid role" }, 400);
		}

		try {
			const result = await db
				.prepare(
					"UPDATE users SET name = ?1, qualification = ?2, role = ?3 WHERE user_id = ?4"
				)
				.bind(payload.name.trim(), payload.qualification, payload.role, userId)
				.run();

			if (!result.meta.changes) {
				return c.json({ ok: false, error: "User not found" }, 404);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update user";
			if (message.toLowerCase().includes("unique")) {
				return c.json({ ok: false, error: "Username already exists" }, 409);
			}
			return c.json({ ok: false, error: "Failed to update user" }, 500);
		}

		const updatedRow = await getUserById(db, userId, Date.now());
		if (!updatedRow) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		return c.json({ ok: true, user: mapUserRow(updatedRow) });
	});

	app.delete("/api/users/:id", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can delete users" }, 403);
		}

		const userId = parseUserId(c.req.param("id"));
		if (userId === null) {
			return c.json({ ok: false, error: "Invalid user id" }, 400);
		}

		const authUserId = Number(c.get("authUserId"));
		const deletedCurrentUser = Number.isInteger(authUserId) && authUserId === userId;

		await db.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(userId).run();
		const result = await db.prepare("DELETE FROM users WHERE user_id = ?1").bind(userId).run();

		if (!result.meta.changes) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		if (deletedCurrentUser) {
			deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
		}

		return c.json({ ok: true, deletedCurrentUser });
	});

	app.post("/api/users/:id/reset-password", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		if (c.get("authUserRole") !== "Admin") {
			return c.json({ ok: false, error: "Only Admin users can reset passwords" }, 403);
		}

		const userId = parseUserId(c.req.param("id"));
		if (userId === null) {
			return c.json({ ok: false, error: "Invalid user id" }, 400);
		}

		const adminSettings = await getAdminSettingsRow(db);
		const result = await db
			.prepare(
				"UPDATE users SET password_hash = ?1, password_salt = ?2, password_iterations = ?3, password_algo = ?4 WHERE user_id = ?5"
			)
			.bind(
				adminSettings.default_password_hash,
				adminSettings.default_password_salt,
				adminSettings.default_password_iterations,
				adminSettings.default_password_algo,
				userId
			)
			.run();

		if (!result.meta.changes) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		return c.json({
			ok: true,
			message: "Password reset to the current admin default password.",
		});
	});
}
