import type { UserRole } from "../../shared/users.types";
import type { AppContext } from "../types";

// Auth/security constants are centralized here to avoid magic numbers.
export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

// Workers runtime currently caps PBKDF2 iterations at 100000 in this path.
// Keep this value aligned with seed data and runtime compatibility.
export const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_BYTES = 32;

export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const RATE_LIMIT_MAX_FAILURES = 10;

export type UserAuthRow = {
	user_id: number;
	name: string;
	role: UserRole;
	imageUrl?: string | null;
	password_hash: string;
	password_salt: string;
	password_iterations: number;
	password_algo: string;
};

export type SessionRow = {
	session_id: string;
	user_id: number;
	expires_at: number;
};

type RateLimitRow = {
	window_start: number;
	attempts: number;
};

export function isHttpsRequest(urlString: string): boolean {
	const url = new URL(urlString);
	return url.protocol === "https:";
}

export function isValidUsername(input: unknown): input is string {
	if (typeof input !== "string") return false;
	const trimmed = input.trim();
	if (trimmed.length < 3 || trimmed.length > 64) return false;
	return /^[a-zA-Z0-9_.-]+$/.test(trimmed);
}

export function isValidPassword(input: unknown): input is string {
	if (typeof input !== "string") return false;
	return input.length >= 4 && input.length <= 128;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error("Invalid hex string length");
	}
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

export function randomHex(bytesLength: number): string {
	const bytes = new Uint8Array(bytesLength);
	crypto.getRandomValues(bytes);
	return bytesToHex(bytes);
}

// Constant-time compare lowers timing-attack risk for hash equality checks.
export function timingSafeEqualHex(a: string, b: string): boolean {
	const len = Math.max(a.length, b.length);
	let mismatch = a.length ^ b.length;
	for (let i = 0; i < len; i++) {
		const charA = i < a.length ? a.charCodeAt(i) : 0;
		const charB = i < b.length ? b.charCodeAt(i) : 0;
		mismatch |= charA ^ charB;
	}
	return mismatch === 0;
}

export async function pbkdf2HashHex(
	password: string,
	saltHex: string,
	iterations: number
): Promise<string> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: hexToBytes(saltHex),
			iterations,
		},
		keyMaterial,
		PBKDF2_KEY_BYTES * 8
	);
	return bytesToHex(new Uint8Array(derivedBits));
}

export function getRateLimitKey(c: AppContext, username: string): string {
	const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
	return `${ip}:${username.toLowerCase()}`;
}

export async function isRateLimited(db: D1Database, key: string, nowMs: number): Promise<boolean> {
	const row = await db
		.prepare("SELECT window_start, attempts FROM auth_rate_limits WHERE key = ?1")
		.bind(key)
		.first<RateLimitRow>();

	if (!row) return false;
	if (nowMs - row.window_start >= RATE_LIMIT_WINDOW_MS) return false;
	return row.attempts >= RATE_LIMIT_MAX_FAILURES;
}

export async function recordLoginFailure(db: D1Database, key: string, nowMs: number): Promise<void> {
	const row = await db
		.prepare("SELECT window_start, attempts FROM auth_rate_limits WHERE key = ?1")
		.bind(key)
		.first<RateLimitRow>();

	if (!row || nowMs - row.window_start >= RATE_LIMIT_WINDOW_MS) {
		await db
			.prepare(
				"INSERT INTO auth_rate_limits (key, window_start, attempts) VALUES (?1, ?2, 1) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, attempts = excluded.attempts"
			)
			.bind(key, nowMs)
			.run();
		return;
	}

	await db
		.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE key = ?1")
		.bind(key)
		.run();
}

export async function clearRateLimit(db: D1Database, key: string): Promise<void> {
	await db.prepare("DELETE FROM auth_rate_limits WHERE key = ?1").bind(key).run();
}
