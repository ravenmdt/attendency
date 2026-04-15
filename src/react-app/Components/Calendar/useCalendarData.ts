import { useEffect, useState } from 'react'
import { buildAvailabilityMap, getAvailabilityKey } from './calendar.utils'
import type { AvailabilityItem, AvailabilityOverride, CalendarInfoItem } from './calendar.types'

// ─── API response shapes ───────────────────────────────────────────────────────

// D1 stores booleans as integers (0 or 1). These types describe the raw API rows
// before we convert them to proper JS booleans.
type ApiAvailabilityRow = { date: string; wave: 0 | 1; available: 0 | 1 }
type ApiCalendarInfoRow = { date: string; nights: 0 | 1; priority: 0 | 1; type: string }
type ApiResponse<T>     = { ok: boolean; rows: T[] }

// ─── Hook ─────────────────────────────────────────────────────────────────────

// useCalendarData is a custom React hook — a reusable function (marked by the "use"
// prefix) that groups related state and side-effects in one place.
//
// Responsibilities:
//   1. Fetch availability + calendar_info from the worker on first render.
//   2. Expose the results as typed Maps so Calendar.tsx can look up any date in O(1).
//   3. Expose `applyChanges` so Calendar.tsx can merge saved edits back into the
//      baseline without needing direct access to `setBaselineAvailability`.
export function useCalendarData(userId: number) {
  // The "ground truth" availability from D1. Updated after each successful save.
  // Key = "YYYY-MM-DD|wave", value = true/false.
  const [baselineAvailability, setBaselineAvailability] = useState<Map<string, boolean>>(
    () => new Map()
  )

  // Day-type metadata (nights / priority / type) keyed by "YYYY-MM-DD".
  const [calendarInfoMap, setCalendarInfoMap] = useState<Map<string, CalendarInfoItem>>(
    () => new Map()
  )

  // True while the initial API fetch is in flight; used to show a loading state.
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Promise.all fires both API calls at the same time (in parallel) so we only
    // wait for the slower of the two instead of waiting for them sequentially.
    Promise.all([
      fetch(`/api/availability?userId=${userId}`)
        .then((r) => r.json() as Promise<ApiResponse<ApiAvailabilityRow>>),
      fetch(`/api/calendar-info?userId=${userId}`)
        .then((r) => r.json() as Promise<ApiResponse<ApiCalendarInfoRow>>),
    ])
      .then(([avail, info]) => {
        // Convert the D1 integer flags (0 / 1) to real JS booleans before storing.
        const availItems: AvailabilityItem[] = avail.rows.map((r) => ({
          date:      r.date,
          wave:      r.wave,
          available: Boolean(r.available),
        }))
        setBaselineAvailability(buildAvailabilityMap(availItems))

        // Build a Map so Calendar.tsx can look up any date in O(1) time.
        const infoMap = new Map<string, CalendarInfoItem>()
        for (const r of info.rows) {
          infoMap.set(r.date, {
            date:     r.date,
            nights:   Boolean(r.nights),
            priority: Boolean(r.priority),
            type:     r.type,
          })
        }
        setCalendarInfoMap(infoMap)
      })
      .catch((err) => console.error('Failed to load calendar data:', err))
      .finally(() => setIsLoading(false))
  }, [userId]) // Re-fetch automatically if the userId ever changes (e.g. on login switch).

  // Merges a batch of just-saved overrides back into the baseline.
  // Called by Calendar.tsx after a successful POST to /api/availability/save
  // so the local baseline reflects what is now persisted in D1.
  function applyChanges(changes: AvailabilityOverride[]) {
    setBaselineAvailability((current) => {
      const next = new Map(current)
      for (const change of changes) {
        const key = getAvailabilityKey(change.date, change.wave)
        if (change.available === null) {
          next.delete(key)  // null = "no entry" → row was deleted from D1
        } else {
          next.set(key, change.available)
        }
      }
      return next
    })
  }

  return { baselineAvailability, calendarInfoMap, isLoading, applyChanges }
}
