import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  countDayStatuses,
  createEmptyWaveGroups,
  formatLongDate,
  getMonthGrid,
} from "./reports.utils";
import type { ReportsCalendarProps } from "./reports.types";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/*
  ReportsMonthCalendar

  This left-side panel is intentionally kept focused on one job:
  showing the month grid and letting the user pick which day to inspect.

  Add a letter or icon if required in front of the {availableCount} or {partialCount} values if required
*/
export default function ReportsMonthCalendar({
  selectedDate,
  visibleMonth,
  availabilityByDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
}: ReportsCalendarProps) {
  const days = getMonthGrid(visibleMonth);
  const monthTitle = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="ui-surface ui-border rounded-xl border p-4 sm:p-5 md:rounded-r-none md:border-r-0 md:pr-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="ui-text-primary text-sm font-semibold">
            {monthTitle}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Pick a day to review full and partial attendance across both waves.
          </p>
        </div>

        <div className="flex items-center">
          <div className="ui-calendar-control-group relative flex items-center rounded-md outline -outline-offset-1 md:items-stretch">
            <button
              type="button"
              onClick={onPreviousMonth}
              className="ui-calendar-control-button flex h-9 w-10 items-center justify-center rounded-l-md focus:relative"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={onGoToToday}
              className="ui-calendar-control-button-primary hidden px-3.5 text-sm font-semibold focus:relative sm:block"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="ui-calendar-control-button flex h-9 w-10 items-center justify-center rounded-r-md focus:relative"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
        {days.map((day) => {
          const groups =
            availabilityByDate.get(day.date) ?? createEmptyWaveGroups();
          const { availableCount, partialCount } = countDayStatuses(groups);
          const isSelected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={[
                "flex min-h-14 flex-col items-center justify-center rounded-lg px-1 py-2 transition",
                day.isCurrentMonth
                  ? "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
                  : "text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-white/5",
                isSelected
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:text-white"
                  : "",
                day.isToday && !isSelected
                  ? "ring-1 ring-inset ring-indigo-500/40"
                  : "",
              ].join(" ")}
              aria-label={formatLongDate(day.date)}
            >
              <time dateTime={day.date} className="text-sm font-semibold">
                {day.date.split("-").pop()?.replace(/^0/, "")}
              </time>

              <div className="mt-1 flex items-center gap-1">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                  ].join(" ")}
                >
                  {availableCount}
                </span>
                <span
                  className={[
                    "inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                  ].join(" ")}
                >
                  {partialCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
