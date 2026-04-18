import FeedbackInput from "./FeedbackInput";
import FeedbackFeed from "./FeedbackFeed";
import { useFeedbackData } from "./useFeedbackData";

/*
  Feedback.tsx

  Main page shell for the Feedback section.
  All state and data-fetching logic lives in useFeedbackData — this component
  is purely structural: it lays out the input form above the feed, and wires
  the props from the hook into the child components.
*/

export default function Feedback() {
  const feedback = useFeedbackData();

  return (
    <div className="space-y-12">
      {/* ── Submission form ──────────────────────────────────────────────────── */}
      <FeedbackInput
        value={feedback.draftText}
        onChange={feedback.setDraftText}
        onSubmit={feedback.handleSubmit}
        isSubmitting={feedback.isSubmitting}
        submitError={feedback.submitError}
      />

      {/* ── Feed heading ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white mb-6">
          All Feedback
        </h2>

        {/* ── Timeline feed ─────────────────────────────────────────────────── */}
        <FeedbackFeed
          items={feedback.items}
          isLoading={feedback.isLoading}
          listError={feedback.listError}
          isAdmin={feedback.isAdmin}
          acceptingId={feedback.acceptingId}
          deletingId={feedback.deletingId}
          onAccept={feedback.handleAccept}
          onDelete={feedback.handleDelete}
        />
      </div>
    </div>
  );
}
