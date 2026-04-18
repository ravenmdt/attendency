import { CheckIcon, TrashIcon } from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import type { AttendanceChangeFeedItem } from "./reports.types";

/*
  ReportsChangeFeedItem.tsx

  This component mirrors the timeline layout used by the Feedback page, but the
  content is tailored to attendance auditing. Keeping it small and focused makes
  the Reports page easier to scan and maintain.
*/

type ReportsChangeFeedItemProps = {
  item: AttendanceChangeFeedItem;
  showDateHeader: boolean;
  isLast: boolean;
  isModerator: boolean;
  isAccepting: boolean;
  isDeleting: boolean;
  onAccept: (changeId: number) => void | Promise<void>;
  onDelete: (changeId: number) => void | Promise<void>;
};

function formatCreatedAt(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAffectedDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(item: AttendanceChangeFeedItem): string {
  if (item.nextAvailable === null) {
    return "Unavailable";
  }

  // In this app, false means "partially available" and only null means
  // there is no saved availability entry for that wave.
  return item.nextAvailable === 1 ? "Available" : "Partially available";
}

function getStatusClassName(item: AttendanceChangeFeedItem): string {
  if (item.nextAvailable === null) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
  }

  return item.nextAvailable === 1
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
}

function toAvailabilityPhrase(value: 0 | 1 | null): string {
  if (value === null) return "unavailable";
  return value === 1 ? "available" : "partially available";
}

function buildSummary(item: AttendanceChangeFeedItem): string {
  const waveLabel = item.wave === 0 ? "Wave 1" : "Wave 2";
  const dayLabel = formatAffectedDate(item.date);

  if (item.nextAvailable === null) {
    if (item.actorUserName && item.actorUserName !== item.subjectUserName) {
      return `${item.actorUserName} changed ${item.subjectUserName}'s ${waveLabel} attendance to unavailable for ${dayLabel}.`;
    }

    return `${item.subjectUserName} changed their ${waveLabel} attendance to unavailable for ${dayLabel}.`;
  }

  if (
    item.previousAvailable !== null &&
    item.previousAvailable !== item.nextAvailable
  ) {
    if (item.actorUserName && item.actorUserName !== item.subjectUserName) {
      return `${item.actorUserName} changed ${item.subjectUserName}'s ${waveLabel} attendance from ${toAvailabilityPhrase(item.previousAvailable)} to ${toAvailabilityPhrase(item.nextAvailable)} for ${dayLabel}.`;
    }

    return `${item.subjectUserName} changed their ${waveLabel} attendance from ${toAvailabilityPhrase(item.previousAvailable)} to ${toAvailabilityPhrase(item.nextAvailable)} for ${dayLabel}.`;
  }

  if (item.actorUserName && item.actorUserName !== item.subjectUserName) {
    return `${item.actorUserName} marked ${item.subjectUserName} as ${toAvailabilityPhrase(item.nextAvailable)} for ${waveLabel} on ${dayLabel}.`;
  }

  return `${item.subjectUserName} marked themselves ${toAvailabilityPhrase(item.nextAvailable)} for ${waveLabel} on ${dayLabel}.`;
}

export default function ReportsChangeFeedItem({
  item,
  showDateHeader,
  isLast,
  isModerator,
  isAccepting,
  isDeleting,
  onAccept,
  onDelete,
}: ReportsChangeFeedItemProps) {
  return (
    <li>
      {showDateHeader ? (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {formatAffectedDate(item.date)}
          </span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        </div>
      ) : null}

      <div className="relative pb-8">
        {!isLast ? (
          <span
            aria-hidden="true"
            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-white/10"
          />
        ) : null}

        <div className="relative flex space-x-3">
          <div className="shrink-0">
            {item.subjectUserImageUrl ? (
              <img
                src={item.subjectUserImageUrl}
                alt={item.subjectUserName}
                className="size-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-900">
                <UserCircleIcon className="size-8 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {item.subjectUserName}
              </p>

              <p
                className={[
                  "wrap-break-word text-sm text-gray-900 dark:text-white",
                  item.accepted
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {buildSummary(item)}
              </p>

              {isModerator ? (
                <div className="mt-2 flex items-center gap-x-2">
                  {!item.accepted ? (
                    <button
                      type="button"
                      onClick={() => onAccept(item.changeId)}
                      disabled={isAccepting || isDeleting}
                      title="Mark as accepted"
                      className="inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40 transition-colors"
                    >
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      {isAccepting ? "Accepting…" : "Accept"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onDelete(item.changeId)}
                    disabled={isAccepting || isDeleting}
                    title="Delete permanently"
                    className="inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <TrashIcon className="size-3.5" aria-hidden="true" />
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    getStatusClassName(item),
                  ].join(" ")}
                >
                  {getStatusLabel(item)}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.wave === 0 ? "Wave 1" : "Wave 2"} •{" "}
                  {formatAffectedDate(item.date)}
                </span>
              </div>
            </div>

            <div className="shrink-0 whitespace-nowrap pt-0.5 text-right text-xs text-gray-500 dark:text-gray-400">
              <time dateTime={new Date(item.createdAt).toISOString()}>
                {formatCreatedAt(item.createdAt)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
