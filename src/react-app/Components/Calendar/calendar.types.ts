// ─── Availability ─────────────────────────────────────────────────────────────

// Wave represents which shift of the day is being described.
// Wave 0 = first shift of the day, Wave 1 = second shift.
export type AvailabilityWave = 0 | 1

// Three possible states for one wave on one day:
//   true  = person is fully available
//   false = person is partially available
//   null  = no entry exists, which the UI treats as not available
export type AvailabilityValue = boolean | null

// Matches one row in the availability table in D1.
export type AvailabilityItem = {
  date: string            // "YYYY-MM-DD"
  wave: AvailabilityWave
  available: boolean
}

// One unsaved user edit. Same shape as AvailabilityItem except `available` can be null,
// which means "delete this row from D1" when the save reaches the worker.
export type AvailabilityOverride = {
  date: string
  wave: AvailabilityWave
  available: AvailabilityValue
}

// ─── Calendar info ─────────────────────────────────────────────────────────────

// Matches one row in the calendar_info table in D1.
// Describes the day-type metadata shown in the left column of each calendar cell.
export type CalendarInfoItem = {
  date: string
  nights: boolean    // true = night-shift is scheduled that day
  priority: boolean  // true = this day is marked as high priority
  type: 'PTT' | 'ACT' // short code restricted to PTT or ACT
}

// ─── Calendar grid ─────────────────────────────────────────────────────────────

// An event shown in the mobile event list below the compact grid.
// Not yet connected to live data — kept as a placeholder shape for future use.
export type EventItem = {
  id: number
  name: string
  time: string      // display string, e.g. "10:00 AM"
  datetime: string  // ISO string used in the <time> HTML element for accessibility
  href: string
}

// One cell in the 7×6 calendar grid, rendered on both desktop and mobile.
export type CalendarDay = {
  date: string             // "YYYY-MM-DD"
  isCurrentMonth: boolean  // false for padding days outside the visible month
  isToday: boolean
  isSelected: boolean
  events: EventItem[]
}
