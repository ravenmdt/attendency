import { useMemo, useState } from "react";
import { shiftMonth } from "../Calendar/calendar.utils";
import ReportsMonthCalendar from "./ReportsMonthCalendar";
import ReportsWavePanel from "./ReportsWavePanel";
import { useReportsData } from "./useReportsData";
import {
  countDayStatuses,
  createEmptyWaveGroups,
  formatLongDate,
  getDefaultSelectedDate,
  getStartOfMonth,
} from "./reports.utils";

/*
  Reports.tsx

  This is the main entry component for the Reports view.
  It owns the selected month and selected day, while smaller child components
  focus on rendering the calendar and the two wave lists.
*/
export default function Reports() {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getStartOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultSelectedDate(new Date()),
  );

  const { availabilityByDate, isLoading, error } = useReportsData(visibleMonth);

  const selectedWaveGroups = useMemo(
    () => availabilityByDate.get(selectedDate) ?? createEmptyWaveGroups(),
    [availabilityByDate, selectedDate],
  );

  function showMonth(delta: number) {
    const nextMonth = shiftMonth(visibleMonth, delta);
    setVisibleMonth(nextMonth);
    setSelectedDate(getDefaultSelectedDate(nextMonth));
  }

  function goToToday() {
    const todayMonth = getStartOfMonth(new Date());
    setVisibleMonth(todayMonth);
    setSelectedDate(getDefaultSelectedDate(todayMonth));
  }

  const { availableCount, partialCount } = useMemo(
    () => countDayStatuses(selectedWaveGroups),
    [selectedWaveGroups],
  );

  const totalMarkedUsersForDay = availableCount + partialCount;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ui-text-primary text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review the saved attendance for the selected day, including fully and
          partially available people across both waves.
        </p>
      </header>

      {error ? <p className="ui-danger-text text-sm">{error}</p> : null}

      <div className="md:grid md:grid-cols-2 md:gap-0">
        <ReportsMonthCalendar
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
          availabilityByDate={availabilityByDate}
          onSelectDate={setSelectedDate}
          onPreviousMonth={() => showMonth(-1)}
          onNextMonth={() => showMonth(1)}
          onGoToToday={goToToday}
        />

        <section className="mt-6 md:mt-0 md:pl-6">
          <div className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="ui-text-primary text-base font-semibold">
                  Availability for{" "}
                  <time dateTime={selectedDate}>
                    {formatLongDate(selectedDate)}
                  </time>
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Names and profile photos are loaded from the real user
                  records.
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-300">
                {totalMarkedUsersForDay} marked • {availableCount} available •{" "}
                {partialCount} partial
              </div>
            </div>

            {isLoading ? (
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                Loading reports data…
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                <ReportsWavePanel
                  title="Wave 1"
                  users={selectedWaveGroups[0]}
                  accentClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  emptyMessage="No attendance entries are recorded for wave 1 on this day."
                />
                <ReportsWavePanel
                  title="Wave 2"
                  users={selectedWaveGroups[1]}
                  accentClassName="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                  emptyMessage="No attendance entries are recorded for wave 2 on this day."
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
