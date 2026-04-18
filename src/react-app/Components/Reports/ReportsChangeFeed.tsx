import ReportsChangeFeedItem from "./ReportsChangeFeedItem";
import type { AttendanceChangeFeedItem } from "./reports.types";

/*
  ReportsChangeFeed.tsx

  This is the read-only attendance audit feed shown on the Reports page.
  It intentionally mirrors the same loading / empty / feed states used on the
  Feedback page so the experience feels familiar across the app.
*/

type ReportsChangeFeedProps = {
  items: AttendanceChangeFeedItem[];
  isLoading: boolean;
  listError: string;
  cutoffDays: number;
  canManageItems: boolean;
  acceptingId: number | null;
  deletingId: number | null;
  onAccept: (changeId: number) => void | Promise<void>;
  onDelete: (changeId: number) => void | Promise<void>;
};

export default function ReportsChangeFeed({
  items,
  isLoading,
  listError,
  cutoffDays,
  canManageItems,
  acceptingId,
  deletingId,
  onAccept,
  onDelete,
}: ReportsChangeFeedProps) {
  return (
    <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="ui-text-primary text-base font-semibold">
            Recent attendance changes
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This rolling feed highlights attendance updates for upcoming copy
            work in the next {cutoffDays} days.
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {cutoffDays}-day window
        </span>
      </div>

      {isLoading ? (
        <p className="ui-text-body py-4 text-sm">Loading attendance changes…</p>
      ) : listError ? (
        <p className="ui-danger-text py-4 text-sm">{listError}</p>
      ) : items.length === 0 ? (
        <p className="ui-text-body py-4 text-sm text-gray-500 dark:text-gray-400">
          No attendance changes are currently visible inside the rolling copy
          window.
        </p>
      ) : (
        <div className="mt-6 max-h-176 overflow-y-auto pr-2 flow-root">
          <ul role="list" className="-mb-8">
            {items.map((item, index) => (
              <ReportsChangeFeedItem
                key={item.changeId}
                item={item}
                showDateHeader={
                  index === 0 || items[index - 1]?.date !== item.date
                }
                isLast={index === items.length - 1}
                isModerator={canManageItems}
                isAccepting={acceptingId === item.changeId}
                isDeleting={deletingId === item.changeId}
                onAccept={onAccept}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
