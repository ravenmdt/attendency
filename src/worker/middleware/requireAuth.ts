import type { Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import type { AppContext } from "../types";
import { SESSION_COOKIE_NAME, type SessionRow } from "../auth/security";

// Middleware that validates the session cookie and exposes user identity
// to all downstream route handlers.
export async function requireAuth(c: AppContext, next: Next) {
	const db = c.env.DB;
	if (!db) return c.json({ ok: false, error: "D1 binding DB is not configured" }, 500);

	const sessionId = getCookie(c, SESSION_COOKIE_NAME);
	if (!sessionId) {
		return c.json({ ok: false, error: "Unauthorized" }, 401);
	}

	const session = await db
		.prepare("SELECT session_id, user_id, expires_at FROM sessions WHERE session_id = ?1")
		.bind(sessionId)
		.first<SessionRow>();

	if (!session) {
		deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
		return c.json({ ok: false, error: "Unauthorized" }, 401);
	}

	const nowMs = Date.now();
	if (session.expires_at <= nowMs) {
		await db.prepare("DELETE FROM sessions WHERE session_id = ?1").bind(sessionId).run();
		deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
		return c.json({ ok: false, error: "Session expired" }, 401);
	}

	// Update activity timestamp so future idle-timeout logic has data.
	await db
		.prepare("UPDATE sessions SET last_seen_at = ?2 WHERE session_id = ?1")
		.bind(sessionId, nowMs)
		.run();

	c.set("authUserId", session.user_id);
	c.set("authSessionId", session.session_id);
	await next();
}
