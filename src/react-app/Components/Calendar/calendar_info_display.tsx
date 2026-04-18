import { BoltIcon, MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";

/*
  calendar_info_display.tsx

  This file intentionally stays small and focused: it contains the tiny visual
  helpers that render calendar metadata in both the month cells and the legend.
  Under the current project conventions, this does not need a file split yet
  because the logic is still purely presentational, closely related, and reused
  together in the same calendar surfaces.
*/

type NightsIconProps = {
  nights: boolean;
  showDayIcon?: boolean;
  showNightIcon?: boolean;
};

type CalendarHoverInfoProps = {
  label: string;
  description: string;
  children: ReactNode;
};

// Shared hover wrapper used by all calendar metadata markers.
// Keeping the tooltip behaviour in one place makes styling and accessibility
// updates consistent everywhere these symbols appear.
function CalendarHoverInfo({
  label,
  description,
  children,
}: CalendarHoverInfoProps) {
  return (
    <span
      className="group/calendar-info relative inline-flex cursor-help items-center"
      tabIndex={0}
      title={`${label}: ${description}`}
    >
      <span aria-hidden="true">{children}</span>
      <span className="pointer-events-none absolute top-1/2 left-full z-60 ml-2 hidden w-44 -translate-y-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] leading-relaxed text-gray-700 shadow-lg group-hover/calendar-info:block group-focus/calendar-info:block dark:border-white/10 dark:bg-gray-800 dark:text-gray-200">
        <span className="ui-text-primary block font-semibold">{label}</span>
        <span className="ui-text-body mt-1 block">{description}</span>
      </span>
    </span>
  );
}

// Shift coverage icon.
// This decides between the sun and moon marker and also respects the admin
// layout settings that can hide either day or night icons across the app.
export function NightsIcon({
  nights,
  showDayIcon = true,
  showNightIcon = true,
}: NightsIconProps) {
  if ((nights && !showNightIcon) || (!nights && !showDayIcon)) {
    return <span className="inline-block size-4" aria-hidden="true" />;
  }

  return nights ? (
    <CalendarHoverInfo
      label="Night shift"
      description="This date is marked for night-shift coverage."
    >
      <MoonIcon className="size-4 text-indigo-600 dark:text-indigo-300" />
    </CalendarHoverInfo>
  ) : (
    <CalendarHoverInfo
      label="Day shift"
      description="This date is marked for daytime coverage."
    >
      <SunIcon className="size-4 text-amber-500 dark:text-amber-300" />
    </CalendarHoverInfo>
  );
}

// Priority marker.
// We only render a visible icon when the date is actually flagged so empty
// calendar cells stay compact and visually quiet.
export function PriorityIcon({ priority }: { priority: boolean }) {
  return priority ? (
    <CalendarHoverInfo
      label="Priority day"
      description="This day has been flagged as high priority."
    >
      <BoltIcon className="size-4 text-amber-500 dark:text-amber-300" />
    </CalendarHoverInfo>
  ) : (
    <span className="inline-block size-4" aria-hidden="true" />
  );
}

// Short calendar type badge.
// The value is normalized to the supported project codes so the UI stays
// consistent even if older or unexpected data reaches this display layer.
export function TypeIcon({ type }: { type: string }) {
  const normalizedType = type === "PTT" ? "PTT" : "ACT";

  return (
    <CalendarHoverInfo
      label={`${normalizedType} type`}
      description={
        normalizedType === "PTT" ? "Basic missions" : "Missionized missions"
      }
    >
      <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
        {normalizedType}
      </span>
    </CalendarHoverInfo>
  );
}
