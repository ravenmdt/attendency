// Shared API contract types for the feedback system.
// Both the frontend (React) and the worker (Hono) import from here so that
// the shape of every request and response stays in sync automatically.

// ─── Row returned by the GET /api/feedback endpoint ──────────────────────────

export type FeedbackItem = {
  // Unique ID of the feedback record
  feedbackId: number
  // The user who wrote it
  userId: number
  userName: string
  userImageUrl: string | null
  // The feedback text body
  text: string
  // Unix timestamp (ms) of submission
  createdAt: number
  // Whether an admin has accepted (acknowledged) this feedback
  accepted: boolean
}

// ─── POST /api/feedback ───────────────────────────────────────────────────────

export type FeedbackCreateRequest = {
  text: string
}

// ─── PATCH /api/feedback/:id/accept ──────────────────────────────────────────

// No request body needed — the ID in the URL is enough

// ─── DELETE /api/feedback/:id ─────────────────────────────────────────────────

// No request body needed

// ─── Response shapes ─────────────────────────────────────────────────────────

export type FeedbackListSuccessResponse = {
  ok: true
  rows: FeedbackItem[]
}

export type FeedbackMutationSuccessResponse = {
  ok: true
}

export type FeedbackErrorResponse = {
  ok: false
  error: string
}

export type FeedbackListResponse = FeedbackListSuccessResponse | FeedbackErrorResponse
export type FeedbackMutationResponse = FeedbackMutationSuccessResponse | FeedbackErrorResponse
