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
    return "ui-pill-danger";
  }

  return item.nextAvailable === 1 ? "ui-pill-success" : "ui-pill-warning";
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
          <span className="ui-text-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
            {formatAffectedDate(item.date)}
          </span>
          <span className="ui-surface-soft h-px flex-1" />
        </div>
      ) : null}

      <div className="relative pb-8">
        {!isLast ? (
          <span
            aria-hidden="true"
            className="ui-surface-soft absolute top-5 left-5 -ml-px h-full w-0.5"
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
              <div className="ui-surface-soft flex size-10 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900">
                <UserCircleIcon className="ui-text-icon size-8" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div className="min-w-0 flex-1">
              <p className="ui-text-muted mb-0.5 text-xs font-medium">
                {item.subjectUserName}
              </p>

              <p
                className={[
                  "ui-text-primary wrap-break-word text-sm",
                  item.accepted ? "ui-text-muted line-through" : "",
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
                      className="ui-pill-success inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="ui-pill-danger inline-flex items-center gap-x-1 rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

                <span className="ui-text-muted text-xs">
                  {item.wave === 0 ? "Wave 1" : "Wave 2"} •{" "}
                  {formatAffectedDate(item.date)}
                </span>
              </div>
            </div>

            <div className="ui-text-muted shrink-0 whitespace-nowrap pt-0.5 text-right text-xs">
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
