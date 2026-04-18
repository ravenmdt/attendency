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
    <div className="space-y-6">
      <header>
        <h1 className="ui-text-primary text-2xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Share updates, suggestions, and issues with the rest of the team.
        </p>
      </header>

      <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
        <FeedbackInput
          value={feedback.draftText}
          onChange={feedback.setDraftText}
          onSubmit={feedback.handleSubmit}
          isSubmitting={feedback.isSubmitting}
          submitError={feedback.submitError}
        />
      </section>

      <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
        <div>
          <h2 className="ui-text-primary text-base font-semibold">
            All Feedback
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review the full shared feedback feed and any accepted items.
          </p>
        </div>

        <div className="mt-6">
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
      </section>
    </div>
  );
}
