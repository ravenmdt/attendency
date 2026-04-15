import type { AvailabilityItem, AvailabilityValue, AvailabilityWave, CalendarDay, EventItem } from './calendar.types'

// ─── Date helpers ──────────────────────────────────────────────────────────────

// Formats a JS Date object as "YYYY-MM-DD" — the string format used in D1 date columns.
// We build the string manually because toISOString() always returns UTC, which can
// produce the wrong date if the user's local timezone is behind UTC.
export function toDateKey(value: Date): string {
  const year  = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')  // getMonth() is 0-indexed
  const day   = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Returns a new Date pointing to the first day of the month `delta` months away.
// delta = -1 → previous month, delta = 1 → next month.
export function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1)
}

// ─── Availability helpers ──────────────────────────────────────────────────────

// Builds a unique string key for a Map lookup from a date + wave pair.
// Using composite string keys in a Map gives O(1) lookups instead of scanning an array.
// Example: "2026-04-15|0" = wave 0 on April 15th.
export function getAvailabilityKey(date: string, wave: AvailabilityWave): string {
  return `${date}|${wave}`
}

// Returns the next state in the three-state toggle cycle:
//   null (no entry) → true (available) → false (unavailable) → null (remove)
export function cycleAvailability(value: AvailabilityValue): AvailabilityValue {
  if (value === null)  return true
  if (value === true)  return false
  return null
}

// Converts a flat array of availability rows (as returned by the API) into a Map
// keyed by "date|wave". This allows O(1) lookups per cell when rendering the grid
// instead of scanning the whole array on every render.
export function buildAvailabilityMap(items: AvailabilityItem[]): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const item of items) {
    map.set(getAvailabilityKey(item.date, item.wave), item.available)
  }
  return map
}

// ─── Availability color ────────────────────────────────────────────────────────

// Maps an availability value to its Tailwind CSS class for coloring a wave bar.
//   true  → green  (available)
//   false → red    (unavailable)
//   null  → gray   (no entry)
export function availabilityColorClass(value: AvailabilityValue): string {
  if (value === true)  return 'bg-green-500/80 dark:bg-green-500/60'
  if (value === false) return 'bg-red-500/80 dark:bg-red-500/60'
  return 'bg-gray-200/60 dark:bg-gray-700/40'
}

// ─── Calendar grid builder ─────────────────────────────────────────────────────

// Builds the 42-cell array (7 columns × 6 rows) for the calendar grid.
// The grid always starts on Monday and fills in days from adjacent months
// to complete the first and last rows.
export function buildMonthDays(month: Date, eventsByDate: Map<string, EventItem[]>): CalendarDay[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)

  // getDay() returns 0 for Sunday; remap so Monday = 0 by rotating the week.
  const startOffset = (monthStart.getDay() + 6) % 7
  const gridStart   = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - startOffset)

  const todayKey = toDateKey(new Date())
  const result: CalendarDay[] = []

  for (let i = 0; i < 42; i += 1) {
    const dayDate = new Date(gridStart)
    dayDate.setDate(gridStart.getDate() + i)
    const dayKey = toDateKey(dayDate)

    result.push({
      date: dayKey,
      isCurrentMonth:
        dayDate.getMonth()    === month.getMonth() &&
        dayDate.getFullYear() === month.getFullYear(),
      isToday:    dayKey === todayKey,
      isSelected: dayKey === todayKey,
      events: eventsByDate.get(dayKey) ?? [],
    })
  }

  return result
}
