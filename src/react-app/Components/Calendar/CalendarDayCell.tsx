// CalendarDayCell renders a single cell in the desktop 7×6 month grid.
//
// This is a "presentational" component — it only renders what it receives via
// props and calls back to the parent (Calendar) when the user interacts.
// Keeping display logic here lets Calendar.tsx stay focused on state management.
import { NightsIcon, PriorityIcon, TypeIcon } from './calendar_info_display'
import { availabilityColorClass } from './calendar.utils'
import type { AvailabilityValue, AvailabilityWave, CalendarDay, CalendarInfoItem } from './calendar.types'

type CalendarDayCellProps = {
  day: CalendarDay
  // Metadata for the left column. Undefined when D1 has no calendar_info row for that date.
  info: CalendarInfoItem | undefined
  // Current effective availability for each wave, after applying any unsaved edits.
  wave0: AvailabilityValue
  wave1: AvailabilityValue
  // Called when the user clicks a wave bar to cycle its state.
  onToggle: (date: string, wave: AvailabilityWave) => void
}

export function CalendarDayCell({ day, info, wave0, wave1, onToggle }: CalendarDayCellProps) {
  // Strip the leading zero from the day number ("08" → "8") for compact display.
  const dayNumber = day.date.split('-')[2].replace(/^0/, '')

  return (
    // data-* attributes are plain HTML that Tailwind reads to apply conditional styles.
    // e.g. `data-is-current-month:bg-white` means "white background only if this attribute is present".
    <div
      data-is-today={day.isToday ? '' : undefined}
      data-is-current-month={day.isCurrentMonth ? '' : undefined}
      className="group relative ui-calendar-day-cell px-3 py-2"
    >
      {/* Date number in the top-left corner. Today's date gets an indigo circle. */}
      <time
        dateTime={day.date}
        className="relative group-not-data-is-current-month:opacity-75 in-data-is-today:flex in-data-is-today:size-6 in-data-is-today:items-center in-data-is-today:justify-center in-data-is-today:rounded-full in-data-is-today:font-semibold ui-calendar-today-circle"
      >
        {dayNumber}
      </time>

      {/*
        Two-column layout below the date number:
          Left  — day info icons (nights / priority / type from calendar_info)
          Right — two clickable wave availability color bars
      */}
      <div className="mt-2 flex">
        {/* Left column: icons rendered from calendar_info_display.tsx. Empty if no entry. */}
        <div className="flex-1 flex flex-col text-xs ui-text-primary">
          {info && (
            <>
              <div><NightsIcon nights={info.nights} /></div>
              <div><PriorityIcon priority={info.priority} /></div>
              <div><TypeIcon type={info.type} /></div>
            </>
          )}
        </div>

        {/*
          Right column: two clickable color bars, one per wave.
          Each click cycles: gray (no entry) → green (available) → red (unavailable) → gray.
        */}
        <div className="flex-1 flex flex-col gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => onToggle(day.date, 0)}
            aria-label={`Toggle wave 0 availability for ${day.date}`}
            title="Wave 0"
            className={`h-4 w-full rounded-sm ${availabilityColorClass(wave0)}`}
          />
          <button
            type="button"
            onClick={() => onToggle(day.date, 1)}
            aria-label={`Toggle wave 1 availability for ${day.date}`}
            title="Wave 1"
            className={`h-4 w-full rounded-sm ${availabilityColorClass(wave1)}`}
          />
        </div>
      </div>
    </div>
  )
}
