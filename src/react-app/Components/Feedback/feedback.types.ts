// Frontend-only types for the feedback page.
// These extend the shared API types with any UI-specific state shapes
// that only matter inside the React layer.

import type { FeedbackItem } from "../../../shared/feedback.types";

// Re-export the shared item type so components only need to import from here.
export type { FeedbackItem };

// State shape managed by useFeedbackData
export type FeedbackPageState = {
  // The list of feedback items fetched from the server (newest-first)
  items: FeedbackItem[];
  // True while the initial list is loading
  isLoading: boolean;
  // Error message to show if the list load fails
  listError: string;
  // The text the current user is typing into the input box
  draftText: string;
  // True while a submit request is in flight
  isSubmitting: boolean;
  // Error message to show if a submit fails
  submitError: string;
  // ID of the item currently being accepted (null if none in flight)
  acceptingId: number | null;
  // ID of the item currently being deleted (null if none in flight)
  deletingId: number | null;
};
