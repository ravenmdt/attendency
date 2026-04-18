/*
  FeedbackInput.tsx

  The text-entry area and submit button for posting new feedback.

  Styling follows the same input + save-button conventions used throughout
  the project (see UserProfileAccountSection.tsx and UserProfile.tsx).
  The textarea is sized to show at least 5 lines and becomes scrollable
  when the user types beyond that height.
*/

type FeedbackInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string;
};

export default function FeedbackInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  submitError,
}: FeedbackInputProps) {
  // Allow Ctrl/Cmd + Enter to submit without requiring the mouse
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }

  const isEmpty = value.trim().length === 0;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
      {/* ── Left description column (mirrors the two-col layout used in settings) */}
      <div>
        <h2 className="ui-text-primary text-base/7 font-semibold">
          Share Feedback
        </h2>
        <p className="ui-text-muted mt-1 text-sm/6">
          Your feedback is visible to everyone. Use Ctrl+Enter to submit
          quickly.
        </p>
      </div>

      {/* ── Right form column ─────────────────────────────────────────────────── */}
      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="col-span-full">
          <label
            htmlFor="feedback-text"
            className="ui-text-primary block text-sm/6 font-medium"
          >
            Your feedback
          </label>

          {/* Input container — same outline + focus style as the text inputs in settings */}
          <div className="mt-2">
            <div className="ui-field-shell flex rounded-md outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2">
              <textarea
                id="feedback-text"
                name="feedback-text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your feedback here…"
                /*
                  rows={5} sets the minimum height to 5 lines.
                  overflow-y-auto lets the box scroll vertically if the user
                  types more than 5 lines — the box never grows taller.
                */
                rows={5}
                maxLength={2000}
                disabled={isSubmitting}
                className="ui-field-input block w-full resize-none overflow-y-auto rounded-md px-3 py-2 text-base focus:outline-none sm:text-sm/6 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Character counter — gives users a sense of how much they've written */}
          <p className="ui-text-muted mt-1 text-right text-xs">
            {value.length} / 2000
          </p>
        </div>

        {/* ── Action row: submit button + error ───────────────────────────────── */}
        <div className="col-span-full flex items-center justify-between gap-x-6">
          <div>
            {submitError && (
              <p className="ui-danger-text text-sm">{submitError}</p>
            )}
          </div>

          {/* Submit button — same class as "Save profile" in UserProfile.tsx */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isEmpty || isSubmitting}
            className="ui-user-edit-save rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
