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
import {
	PBKDF2_ITERATIONS,
	SESSION_COOKIE_NAME,
	isValidPassword,
	isValidUsername,
	pbkdf2HashHex,
	randomHex,
	timingSafeEqualHex,
	type UserAuthRow,
} from "../auth/security";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";
import {
	deleteProfileImageIfStored,
	isExternalImageUrl,
	isInternalProfilePhotoRoute,
	isStoredR2ImageKey,
	mapStoredImageUrlForClient,
	storeProfileImageFromDataUrl,
} from "./userImage.utils";

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

type SaveCurrentUserProfileRequest = {
	name?: string;
	imageUrl?: string | null;
	currentPassword?: string;
	newPassword?: string;
	confirmNewPassword?: string;
};

function parseUserId(rawValue: string): number | null {
	const userId = Number.parseInt(rawValue, 10);
	if (!Number.isInteger(userId) || userId <= 0) return null;
	return userId;
}

function mapUserRow(row: UserListDbRow): UserDetailApiRow {
	const userId = Number(row.id);
	return {
		id: userId,
		name: row.name,
		qualification: row.qualification,
		role: row.role,
		imageUrl: mapStoredImageUrlForClient(userId, row.imageUrl),
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

	app.get("/api/users/me", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const authUserId = Number(c.get("authUserId"));
		const row = await getUserById(db, authUserId, Date.now());
		if (!row) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		return c.json({ ok: true, user: mapUserRow(row) });
	});

	app.post("/api/users/me", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const authUserId = Number(c.get("authUserId"));

		let payload: SaveCurrentUserProfileRequest;
		try {
			payload = (await c.req.json()) as SaveCurrentUserProfileRequest;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!isValidUsername(payload.name)) {
			return c.json({ ok: false, error: "Invalid username format" }, 400);
		}

		const currentStoredUser = await db
			.prepare("SELECT image_url AS imageUrl FROM users WHERE user_id = ?1")
			.bind(authUserId)
			.first<{ imageUrl: string | null }>();

		if (!currentStoredUser) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		const normalizedName = payload.name.trim();
		const normalizedImageUrl =
			typeof payload.imageUrl === "string" && payload.imageUrl.trim().length > 0
				? payload.imageUrl.trim()
				: null;

		let nextStoredImageValue = currentStoredUser.imageUrl ?? null;

		if (normalizedImageUrl === null) {
			nextStoredImageValue = null;
		} else if (/^data:image\//i.test(normalizedImageUrl)) {
			const bucket = c.env.PROFILE_IMAGES;
			if (!bucket) {
				return c.json({ ok: false, error: "R2 profile image storage is not configured" }, 500);
			}

			try {
				nextStoredImageValue = await storeProfileImageFromDataUrl({
					bucket,
					userId: authUserId,
					dataUrl: normalizedImageUrl,
				});
			} catch (error) {
				return c.json(
					{
						ok: false,
						error:
							error instanceof Error
								? error.message
								: "Failed to process the uploaded profile photo",
					},
					400,
				);
			}
		} else if (isInternalProfilePhotoRoute(normalizedImageUrl)) {
			nextStoredImageValue = currentStoredUser.imageUrl ?? null;
		} else if (isExternalImageUrl(normalizedImageUrl)) {
			if (normalizedImageUrl !== currentStoredUser.imageUrl) {
				return c.json({ ok: false, error: "Please upload a profile photo instead of pasting an external URL" }, 400);
			}
			nextStoredImageValue = currentStoredUser.imageUrl ?? null;
		} else {
			return c.json({ ok: false, error: "Invalid profile photo value" }, 400);
		}

		const wantsPasswordChange = Boolean(
			payload.currentPassword || payload.newPassword || payload.confirmNewPassword
		);

		let nextPasswordHash: string | null = null;
		let nextPasswordSalt: string | null = null;
		let nextPasswordIterations: number | null = null;
		let nextPasswordAlgo: string | null = null;

		if (wantsPasswordChange) {
			if (!isValidPassword(payload.currentPassword)) {
				return c.json({ ok: false, error: "Current password is required" }, 400);
			}
			if (!isValidPassword(payload.newPassword)) {
				return c.json({ ok: false, error: "New password must be between 4 and 128 characters" }, 400);
			}
			if (payload.newPassword !== payload.confirmNewPassword) {
				return c.json({ ok: false, error: "New password confirmation does not match" }, 400);
			}

			const authRow = await db
				.prepare(
					"SELECT user_id, name, role, password_hash, password_salt, password_iterations, password_algo FROM users WHERE user_id = ?1"
				)
				.bind(authUserId)
				.first<UserAuthRow>();

			if (!authRow) {
				return c.json({ ok: false, error: "User not found" }, 404);
			}
			if (authRow.password_algo !== "pbkdf2-sha256") {
				return c.json({ ok: false, error: "Unsupported password algorithm" }, 500);
			}

			const currentHash = await pbkdf2HashHex(
				payload.currentPassword,
				authRow.password_salt,
				authRow.password_iterations
			);
			if (!timingSafeEqualHex(currentHash, authRow.password_hash)) {
				return c.json({ ok: false, error: "Current password is incorrect" }, 400);
			}

			nextPasswordSalt = randomHex(16);
			nextPasswordIterations = PBKDF2_ITERATIONS;
			nextPasswordAlgo = "pbkdf2-sha256";
			nextPasswordHash = await pbkdf2HashHex(
				payload.newPassword,
				nextPasswordSalt,
				nextPasswordIterations
			);
		}

		try {
			if (wantsPasswordChange && nextPasswordHash && nextPasswordSalt && nextPasswordIterations) {
				await db
					.prepare(
						"UPDATE users SET name = ?1, image_url = ?2, password_hash = ?3, password_salt = ?4, password_iterations = ?5, password_algo = ?6 WHERE user_id = ?7"
					)
					.bind(
						normalizedName,
						nextStoredImageValue,
						nextPasswordHash,
						nextPasswordSalt,
						nextPasswordIterations,
						nextPasswordAlgo,
						authUserId
					)
					.run();
			} else {
				await db
					.prepare("UPDATE users SET name = ?1, image_url = ?2 WHERE user_id = ?3")
					.bind(normalizedName, nextStoredImageValue, authUserId)
					.run();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update profile";
			if (message.toLowerCase().includes("unique")) {
				return c.json({ ok: false, error: "Username already exists" }, 409);
			}
			return c.json({ ok: false, error: "Failed to update profile" }, 500);
		}

		if (currentStoredUser.imageUrl !== nextStoredImageValue) {
			await deleteProfileImageIfStored(c.env.PROFILE_IMAGES, currentStoredUser.imageUrl);
		}

		const updatedRow = await getUserById(db, authUserId, Date.now());
		if (!updatedRow) {
			return c.json({ ok: false, error: "User not found" }, 404);
		}

		return c.json({ ok: true, user: mapUserRow(updatedRow) });
	});

	app.get("/api/users/:id/photo", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const userId = parseUserId(c.req.param("id"));
		if (userId === null) {
			return c.json({ ok: false, error: "Invalid user id" }, 400);
		}

		const row = await db
			.prepare("SELECT image_url AS imageUrl FROM users WHERE user_id = ?1")
			.bind(userId)
			.first<{ imageUrl: string | null }>();

		if (!row?.imageUrl) {
			return c.body(null, 404);
		}

		if (isStoredR2ImageKey(row.imageUrl)) {
			const bucket = c.env.PROFILE_IMAGES;
			if (!bucket) {
				return c.json({ ok: false, error: "R2 profile image storage is not configured" }, 500);
			}

			const object = await bucket.get(row.imageUrl);
			if (!object?.body) {
				return c.body(null, 404);
			}

			const headers = new Headers();
			headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
			headers.set("Cache-Control", "private, max-age=86400");
			return new Response(object.body, { headers });
		}

		if (isExternalImageUrl(row.imageUrl)) {
			return c.redirect(row.imageUrl, 302);
		}

		if (/^data:image\//i.test(row.imageUrl)) {
			const [meta, base64Payload = ""] = row.imageUrl.split(",", 2);
			const mimeMatch = meta.match(/^data:(image\/[a-z0-9.+-]+);base64$/i);
			if (!mimeMatch) return c.body(null, 404);

			const binaryString = atob(base64Payload);
			const bytes = Uint8Array.from(binaryString, (character) =>
				character.charCodeAt(0),
			);
			return new Response(bytes, {
				headers: {
					"Content-Type": mimeMatch[1],
					"Cache-Control": "private, max-age=86400",
				},
			});
		}

		return c.body(null, 404);
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
