import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../Auth/AuthContext";
import type { FeedbackItem } from "../../../shared/feedback.types";
import type {
  FeedbackListResponse,
  FeedbackMutationResponse,
} from "../../../shared/feedback.types";

/*
  useFeedbackData.ts

  This hook owns all data-fetching and mutation logic for the Feedback page.
  Components that use it get clean state values and action callbacks — they
  don't need to know anything about fetch(), URLs, or error handling.

  Pattern: fetch-on-load, then refetch after every successful mutation
  (submit / accept / delete) so the list always reflects server truth.
*/
export function useFeedbackData() {
  const { authenticatedFetch, currentUser } = useAuth();

  // ── List state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  // ── Input state ─────────────────────────────────────────────────────────────
  const [draftText, setDraftText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Per-item operation state ─────────────────────────────────────────────────
  // Tracks which item (by ID) is currently being accepted or deleted so the
  // button can show a loading/disabled state without blocking the whole page.
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Load feedback list ───────────────────────────────────────────────────────
  // useCallback so the function reference is stable and won't trigger
  // unnecessary re-renders when passed as a prop or dependency.
  const loadFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      setListError("");

      const response = await authenticatedFetch("/api/feedback");
      const body = (await response.json().catch(() => null)) as FeedbackListResponse | null;

      if (!response.ok || !body?.ok) {
        setListError(body && !body.ok ? body.error : "Failed to load feedback");
        return;
      }

      setItems(body.rows);
    } catch {
      setListError("Network error while loading feedback");
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  // Load once when the component mounts
  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  // ── Submit new feedback ──────────────────────────────────────────────────────
  async function handleSubmit() {
    // Guard against blank submissions (also enforced on the server)
    if (!draftText.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const response = await authenticatedFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftText.trim() }),
      });

      const body = (await response.json().catch(() => null)) as FeedbackMutationResponse | null;

      if (!response.ok || !body?.ok) {
        setSubmitError(body && !body.ok ? body.error : "Failed to submit feedback");
        return;
      }

      // Clear the input and refresh the list to show the new entry
      setDraftText("");
      await loadFeedback();
    } catch {
      setSubmitError("Network error while submitting feedback");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Accept a feedback item (admin only) ─────────────────────────────────────
  async function handleAccept(feedbackId: number) {
    try {
      setAcceptingId(feedbackId);

      const response = await authenticatedFetch(`/api/feedback/${feedbackId}/accept`, {
        method: "PATCH",
      });

      const body = (await response.json().catch(() => null)) as FeedbackMutationResponse | null;

      if (!response.ok || !body?.ok) {
        // Non-fatal — just log; the feed doesn't need to show an inline error here
        console.error("Accept failed:", body && !body.ok ? body.error : "Unknown error");
        return;
      }

      // IMPORTANT UX NOTE:
      // Instead of reloading the full feedback list (which briefly swaps the
      // whole feed into a loading state), we only update the single item that
      // was accepted. This keeps the rest of the page visually stable.
      setItems((previousItems) =>
        previousItems.map((item) =>
          item.feedbackId === feedbackId
            ? {
                ...item,
                // The accepted flag drives the line-through styling in FeedbackItem.tsx
                accepted: true,
              }
            : item
        )
      );
    } catch {
      console.error("Network error while accepting feedback");
    } finally {
      setAcceptingId(null);
    }
  }

  // ── Delete a feedback item permanently (admin only) ──────────────────────────
  async function handleDelete(feedbackId: number) {
    try {
      setDeletingId(feedbackId);

      const response = await authenticatedFetch(`/api/feedback/${feedbackId}`, {
        method: "DELETE",
      });

      const body = (await response.json().catch(() => null)) as FeedbackMutationResponse | null;

      if (!response.ok || !body?.ok) {
        console.error("Delete failed:", body && !body.ok ? body.error : "Unknown error");
        return;
      }

      // Refresh the list so the deleted item disappears
      await loadFeedback();
    } catch {
      console.error("Network error while deleting feedback");
    } finally {
      setDeletingId(null);
    }
  }

  return {
    // List data
    items,
    isLoading,
    listError,
    // Input
    draftText,
    setDraftText,
    isSubmitting,
    submitError,
    // Per-item operations
    acceptingId,
    deletingId,
    handleSubmit,
    handleAccept,
    handleDelete,
    // The current user's role so components can gate admin UI
    isAdmin: currentUser?.role === "Admin",
  };
}
