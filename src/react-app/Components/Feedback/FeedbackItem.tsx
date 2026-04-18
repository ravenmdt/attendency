import { UserCircleIcon } from "@heroicons/react/24/solid";
import { CheckIcon, TrashIcon } from "@heroicons/react/20/solid";
import type { FeedbackItem } from "./feedback.types";

/*
  FeedbackItem.tsx

  Renders a single feedback entry in the timeline-style feed.
  Layout: avatar on the left → vertical connector line → text + date on the right.

  For admin users, two inline controls appear after the feedback text:
    • Accept  — strikes through the text to acknowledge the feedback
    • Delete  — permanently removes the entry (confirmed visually by disappearing)
*/

type FeedbackItemProps = {
  item: FeedbackItem;
  // Whether the "Accept" button should be shown (admin-only gate done by parent)
  isAdmin: boolean;
  // True while this specific item's accept request is in flight
  isAccepting: boolean;
  // True while this specific item's delete request is in flight
  isDeleting: boolean;
  onAccept: (feedbackId: number) => void;
  onDelete: (feedbackId: number) => void;
  // True when this is the last item in the list (hides the vertical connector line)
  isLast: boolean;
};

// Helper: format a Unix-ms timestamp into a readable "Apr 17, 2026" string
function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FeedbackItemCard({
  item,
  isAdmin,
  isAccepting,
  isDeleting,
  onAccept,
  onDelete,
  isLast,
}: FeedbackItemProps) {
  return (
    <li>
      <div className="relative pb-8">
        {/*
          Vertical connector line drawn between avatar centres.
          Hidden for the last item so there's no dangling line at the bottom.
        */}
        {!isLast && (
          <span
            aria-hidden="true"
            className="ui-surface-soft absolute top-5 left-5 -ml-px h-full w-0.5"
          />
        )}

        <div className="relative flex space-x-3">
          {/* ── Avatar ──────────────────────────────────────────────────────── */}
          <div className="shrink-0">
            {item.userImageUrl ? (
              <img
                src={item.userImageUrl}
                alt={item.userName}
                className="size-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
              />
            ) : (
              // Fallback icon when the user has no profile photo
              <div className="ui-surface-soft flex size-10 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900">
                <UserCircleIcon className="ui-text-icon size-8" />
              </div>
            )}
          </div>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div className="min-w-0 flex-1">
              {/* Author name */}
              <p className="ui-text-muted mb-0.5 text-xs font-medium">
                {item.userName}
              </p>

              {/* Feedback text — line-through when accepted by an admin */}
              <p
                className={[
                  "ui-text-primary wrap-break-word text-sm",
                  item.accepted ? "ui-text-muted line-through" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.text}
              </p>

              {/* Admin controls — only rendered when the viewer is an Admin */}
              {isAdmin && (
                <div className="mt-2 flex items-center gap-x-2">
                  {/* Accept button — disabled once already accepted */}
                  {!item.accepted && (
                    <button
                      type="button"
                      onClick={() => onAccept(item.feedbackId)}
                      disabled={isAccepting || isDeleting}
                      title="Mark as accepted"
                      className="ui-pill-success inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      {isAccepting ? "Accepting…" : "Accept"}
                    </button>
                  )}

                  {/* Delete button — permanently removes the entry */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.feedbackId)}
                    disabled={isAccepting || isDeleting}
                    title="Delete permanently"
                    className="ui-pill-danger inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon className="size-3.5" aria-hidden="true" />
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </div>

            {/* ── Date ──────────────────────────────────────────────────────── */}
            <div className="ui-text-muted shrink-0 pt-0.5 text-right text-xs whitespace-nowrap">
              <time dateTime={new Date(item.createdAt).toISOString()}>
                {formatDate(item.createdAt)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
