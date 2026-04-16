import type { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { LoginRequest } from "../../shared/auth.types";
import {
	PBKDF2_ITERATIONS,
	SESSION_COOKIE_NAME,
	SESSION_TTL_MS,
	SESSION_TTL_SECONDS,
	clearRateLimit,
	getRateLimitKey,
	isHttpsRequest,
	isRateLimited,
	isValidPassword,
	isValidUsername,
	pbkdf2HashHex,
	randomHex,
	recordLoginFailure,
	timingSafeEqualHex,
	type UserAuthRow,
} from "../auth/security";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

// Registers all authentication endpoints on the app.
export function registerAuthRoutes(app: Hono<AppEnv>) {
	app.post("/api/auth/login", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		let payload: { username?: unknown; password?: unknown };
		try {
			payload = (await c.req.json()) as Partial<LoginRequest>;
		} catch {
			return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
		}

		if (!isValidUsername(payload.username) || !isValidPassword(payload.password)) {
			return c.json({ ok: false, error: "Invalid username or password format" }, 400);
		}

		const username = payload.username.trim();
		const password = payload.password;
		const nowMs = Date.now();
		const rateLimitKey = getRateLimitKey(c, username);

		if (await isRateLimited(db, rateLimitKey, nowMs)) {
			return c.json(
				{ ok: false, error: "Too many login attempts. Please wait and try again." },
				429
			);
		}

		const user = await db
			.prepare(
				"SELECT user_id, name, password_hash, password_salt, password_iterations, password_algo FROM users WHERE name = ?1"
			)
			.bind(username)
			.first<UserAuthRow>();

		if (!user) {
			await recordLoginFailure(db, rateLimitKey, nowMs);
			return c.json({ ok: false, error: "Invalid username or password" }, 401);
		}

		if (user.password_algo !== "pbkdf2-sha256") {
			return c.json({ ok: false, error: "Unsupported password algorithm" }, 500);
		}

		const iterations =
			Number.isFinite(user.password_iterations) && user.password_iterations > 0
				? user.password_iterations
				: PBKDF2_ITERATIONS;

		const computedHash = await pbkdf2HashHex(password, user.password_salt, iterations);
		if (!timingSafeEqualHex(computedHash, user.password_hash)) {
			await recordLoginFailure(db, rateLimitKey, nowMs);
			return c.json({ ok: false, error: "Invalid username or password" }, 401);
		}

		await clearRateLimit(db, rateLimitKey);

		const sessionId = randomHex(32);
		const expiresAt = nowMs + SESSION_TTL_MS;
		await db
			.prepare(
				"INSERT INTO sessions (session_id, user_id, created_at, last_seen_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)"
			)
			.bind(sessionId, user.user_id, nowMs, nowMs, expiresAt)
			.run();

		setCookie(c, SESSION_COOKIE_NAME, sessionId, {
			httpOnly: true,
			secure: isHttpsRequest(c.req.url),
			sameSite: "Lax",
			path: "/",
			maxAge: SESSION_TTL_SECONDS,
		});

		return c.json({
			ok: true,
			user: {
				id: user.user_id,
				name: user.name,
			},
		});
	});

	// Session and logout require a valid cookie-backed session.
	app.use("/api/auth/session", requireAuth);
	app.use("/api/auth/logout", requireAuth);

	app.get("/api/auth/session", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const userId = c.get("authUserId");
		const user = await db
			.prepare("SELECT user_id, name FROM users WHERE user_id = ?1")
			.bind(userId)
			.first<{ user_id: number; name: string }>();

		if (!user) {
			return c.json({ ok: false, error: "User not found" }, 401);
		}

		return c.json({ ok: true, user: { id: user.user_id, name: user.name } });
	});

	app.post("/api/auth/logout", async (c) => {
		const db = c.env.DB;
		if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

		const sessionId = c.get("authSessionId");
		await db.prepare("DELETE FROM sessions WHERE session_id = ?1").bind(sessionId).run();
		deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });

		return c.json({ ok: true });
	});
}
