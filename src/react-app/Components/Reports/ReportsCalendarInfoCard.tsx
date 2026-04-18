import type { ReactNode } from "react";
import type { CalendarInfoItem } from "../Calendar/calendar.types";
import { formatLongDate } from "./reports.utils";

type ReportsCalendarInfoCardProps = {
  selectedDate: string;
  info: CalendarInfoItem | undefined;
  isLoading: boolean;
};

type DetailTileProps = {
  label: string;
  value: ReactNode;
  helperText: string;
  toneClassName: string;
};

type AuditRowProps = {
  label: string;
  person: string;
  timestamp: number | null;
};

function formatAuditTimestamp(timestamp: number | null) {
  if (timestamp === null) {
    return "Not recorded yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function DetailTile({
  label,
  value,
  helperText,
  toneClassName,
}: DetailTileProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
      <dt className="ui-text-muted text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-2">
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            toneClassName,
          ].join(" ")}
        >
          {value}
        </span>
      </dd>
      <p className="ui-text-muted mt-2 text-xs">{helperText}</p>
    </div>
  );
}

function AuditRow({ label, person, timestamp }: AuditRowProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="ui-text-muted text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p className="ui-text-primary mt-2 text-sm font-medium">{person}</p>
      <p className="ui-text-muted mt-1 text-xs">
        {formatAuditTimestamp(timestamp)}
      </p>
    </div>
  );
}

export default function ReportsCalendarInfoCard({
  selectedDate,
  info,
  isLoading,
}: ReportsCalendarInfoCardProps) {
  return (
    <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="ui-text-primary text-base font-semibold">
            Calendar info for{" "}
            <time dateTime={selectedDate}>{formatLongDate(selectedDate)}</time>
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="ui-text-muted mt-6 text-sm">Loading day details…</div>
      ) : info ? (
        <>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailTile
              label="Coverage"
              value={info.nights ? "Nights" : "Day"}
              helperText={
                info.nights
                  ? "Night-shift coverage is planned for this date."
                  : "This date is marked for standard daytime coverage."
              }
              toneClassName="ui-pill-info"
            />
            <DetailTile
              label="Priority"
              value={info.priority ? "Priority" : "Standard"}
              helperText={
                info.priority
                  ? "This day has been flagged as high priority."
                  : "No elevated priority has been set for this day."
              }
              toneClassName={
                info.priority ? "ui-pill-warning" : "ui-pill-neutral"
              }
            />
            <DetailTile
              label="Type"
              value={info.type?.trim() || "Not set"}
              helperText="Short calendar code used across the shared schedule."
              toneClassName="ui-pill-success"
            />
          </dl>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AuditRow
              label="Created by"
              person={info.createdByName ?? "Unknown user"}
              timestamp={info.createdAt}
            />
            <AuditRow
              label="Last updated by"
              person={info.updatedByName ?? "Not updated yet"}
              timestamp={info.updatedAt}
            />
          </div>
        </>
      ) : (
        <div className="ui-text-muted ui-divider-soft mt-6 rounded-lg border border-dashed px-4 py-5 text-sm">
          No calendar info has been saved for the selected day yet.
        </div>
      )}
    </section>
  );
}
