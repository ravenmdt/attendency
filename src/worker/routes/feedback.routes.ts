import type { Hono } from "hono";
import type {
  FeedbackItem,
  FeedbackCreateRequest,
  FeedbackListSuccessResponse,
  FeedbackMutationSuccessResponse,
  FeedbackErrorResponse,
} from "../../shared/feedback.types";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

// ─── DB row shape returned by the SQL query ───────────────────────────────────
// Column aliases must match exactly what the SELECT returns.
type FeedbackDbRow = {
  feedbackId: number;
  userId: number;
  userName: string;
  userImageUrl: string | null;
  text: string;
  createdAt: number;
  accepted: number; // D1 stores booleans as 0/1
};

// ─── Helper: map a raw DB row to the API-safe FeedbackItem shape ──────────────
function mapRow(row: FeedbackDbRow): FeedbackItem {
  return {
    feedbackId: Number(row.feedbackId),
    userId: Number(row.userId),
    userName: row.userName,
    // Return the image URL as-is — profile images stored in R2 are already
    // mapped to the /api/users/:id/photo route before insertion (see users.routes.ts).
    // Feedback reads the value straight from the users table, so the same logic applies.
    userImageUrl: row.userImageUrl ?? null,
    text: row.text,
    createdAt: Number(row.createdAt),
    accepted: Boolean(row.accepted),
  };
}

// ─── Helper: parse and validate a positive integer from a URL param ───────────
function parsePositiveInt(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function registerFeedbackRoutes(app: Hono<AppEnv>) {
  // All feedback routes require a valid session cookie.
  app.use("/api/feedback", requireAuth);
  app.use("/api/feedback/*", requireAuth);

  // ── GET /api/feedback ────────────────────────────────────────────────────────
  // Returns all feedback items newest-first, joined with author info from users.
  app.get("/api/feedback", async (c) => {
    const db = c.env.DB;
    if (!db) return c.json<FeedbackErrorResponse>({ ok: false, error: "D1 binding DB is not configured" }, 500);

    const result = await db
      .prepare(
        `SELECT
          f.feedback_id   AS feedbackId,
          f.user_id       AS userId,
          u.name          AS userName,
          u.image_url     AS userImageUrl,
          f.text          AS text,
          f.created_at    AS createdAt,
          f.accepted      AS accepted
        FROM feedback f
        JOIN users u ON u.user_id = f.user_id
        ORDER BY f.created_at DESC`
      )
      .all<FeedbackDbRow>();

    const response: FeedbackListSuccessResponse = {
      ok: true,
      rows: result.results.map(mapRow),
    };

    return c.json(response);
  });

  // ── POST /api/feedback ───────────────────────────────────────────────────────
  // Any authenticated user may submit a feedback entry.
  app.post("/api/feedback", async (c) => {
    const db = c.env.DB;
    if (!db) return c.json<FeedbackErrorResponse>({ ok: false, error: "D1 binding DB is not configured" }, 500);

    let payload: FeedbackCreateRequest;
    try {
      payload = (await c.req.json()) as FeedbackCreateRequest;
    } catch {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Invalid JSON payload" }, 400);
    }

    // Validate: text must be a non-empty string (trim excess whitespace)
    if (typeof payload?.text !== "string" || payload.text.trim().length === 0) {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Feedback text cannot be empty" }, 400);
    }

    // Cap text length at 2000 characters to prevent abuse
    if (payload.text.trim().length > 2000) {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Feedback text is too long (max 2000 characters)" }, 400);
    }

    const userId = c.get("authUserId");

    await db
      .prepare(
        "INSERT INTO feedback (user_id, text, created_at, accepted) VALUES (?1, ?2, ?3, 0)"
      )
      .bind(userId, payload.text.trim(), Date.now())
      .run();

    return c.json<FeedbackMutationSuccessResponse>({ ok: true }, 201);
  });

  // ── PATCH /api/feedback/:id/accept ───────────────────────────────────────────
  // Toggles accepted = 1 on a feedback item. Admin-only.
  app.patch("/api/feedback/:id/accept", async (c) => {
    const db = c.env.DB;
    if (!db) return c.json<FeedbackErrorResponse>({ ok: false, error: "D1 binding DB is not configured" }, 500);

    // Only admins may accept feedback
    if (c.get("authUserRole") !== "Admin") {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Forbidden" }, 403);
    }

    const feedbackId = parsePositiveInt(c.req.param("id"));
    if (!feedbackId) return c.json<FeedbackErrorResponse>({ ok: false, error: "Invalid feedback ID" }, 400);

    const result = await db
      .prepare("UPDATE feedback SET accepted = 1 WHERE feedback_id = ?1")
      .bind(feedbackId)
      .run();

    // If no rows were changed the ID didn't exist
    if (result.meta.changes === 0) {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Feedback not found" }, 404);
    }

    return c.json<FeedbackMutationSuccessResponse>({ ok: true });
  });

  // ── DELETE /api/feedback/:id ─────────────────────────────────────────────────
  // Permanently removes a feedback entry. Admin-only.
  app.delete("/api/feedback/:id", async (c) => {
    const db = c.env.DB;
    if (!db) return c.json<FeedbackErrorResponse>({ ok: false, error: "D1 binding DB is not configured" }, 500);

    // Only admins may delete feedback
    if (c.get("authUserRole") !== "Admin") {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Forbidden" }, 403);
    }

    const feedbackId = parsePositiveInt(c.req.param("id"));
    if (!feedbackId) return c.json<FeedbackErrorResponse>({ ok: false, error: "Invalid feedback ID" }, 400);

    const result = await db
      .prepare("DELETE FROM feedback WHERE feedback_id = ?1")
      .bind(feedbackId)
      .run();

    if (result.meta.changes === 0) {
      return c.json<FeedbackErrorResponse>({ ok: false, error: "Feedback not found" }, 404);
    }

    return c.json<FeedbackMutationSuccessResponse>({ ok: true });
  });
}
