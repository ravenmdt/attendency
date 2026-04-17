import FeedbackItemCard from "./FeedbackItem";
import type { FeedbackItem } from "./feedback.types";

/*
  FeedbackFeed.tsx

  Renders the full timeline list of feedback items, or appropriate
  empty / error / loading states when needed.
*/

type FeedbackFeedProps = {
  items: FeedbackItem[];
  isLoading: boolean;
  listError: string;
  isAdmin: boolean;
  acceptingId: number | null;
  deletingId: number | null;
  onAccept: (feedbackId: number) => void;
  onDelete: (feedbackId: number) => void;
};

export default function FeedbackFeed({
  items,
  isLoading,
  listError,
  isAdmin,
  acceptingId,
  deletingId,
  onAccept,
  onDelete,
}: FeedbackFeedProps) {
  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <p className="ui-text-body text-sm py-4">Loading feedback…</p>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (listError) {
    return (
      <p className="ui-danger-text text-sm py-4">{listError}</p>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <p className="ui-text-body text-sm py-4 text-gray-400 dark:text-gray-500">
        No feedback yet. Be the first to share yours!
      </p>
    );
  }

  // ── Feed ────────────────────────────────────────────────────────────────────
  return (
    /*
      The outer div uses flow-root so it establishes its own block-formatting
      context — this prevents the absolute-positioned connector lines from
      bleeding outside the list container.
    */
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, index) => (
          <FeedbackItemCard
            key={item.feedbackId}
            item={item}
            isAdmin={isAdmin}
            isAccepting={acceptingId === item.feedbackId}
            isDeleting={deletingId === item.feedbackId}
            onAccept={onAccept}
            onDelete={onDelete}
            // The last card should not render the hanging connector line
            isLast={index === items.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
