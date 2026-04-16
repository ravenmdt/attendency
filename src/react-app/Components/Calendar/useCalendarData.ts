import { useEffect, useState } from 'react'
import { buildAvailabilityMap, getAvailabilityKey } from './calendar.utils'
import type { AvailabilityItem, AvailabilityOverride, CalendarInfoItem } from './calendar.types'
import type {
  ApiResponse,
  AvailabilityApiRow,
  CalendarInfoApiRow,
} from '../../../shared/calendar.types'

// ─── API response shapes ───────────────────────────────────────────────────────
// Raw API row contracts are now shared with the worker in src/shared.

// ─── Hook ─────────────────────────────────────────────────────────────────────

// useCalendarData is a custom React hook — a reusable function (marked by the "use"
// prefix) that groups related state and side-effects in one place.
//
// Responsibilities:
//   1. Fetch availability + calendar_info from the worker on first render.
//   2. Expose the results as typed Maps so Calendar.tsx can look up any date in O(1).
//   3. Expose `applyChanges` so Calendar.tsx can merge saved edits back into the
//      baseline without needing direct access to `setBaselineAvailability`.
export function useCalendarData() {
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
      // No userId query is sent anymore. The backend reads user identity from
      // the authenticated session cookie (HttpOnly) set at login.
      fetch('/api/availability', { credentials: 'same-origin' })
        .then((r) => {
          if (!r.ok) throw new Error(`Availability request failed: ${r.status}`)
          return r.json() as Promise<ApiResponse<AvailabilityApiRow>>
        }),
      fetch('/api/calendar-info', { credentials: 'same-origin' })
        .then((r) => {
          if (!r.ok) throw new Error(`Calendar info request failed: ${r.status}`)
          return r.json() as Promise<ApiResponse<CalendarInfoApiRow>>
        }),
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
  }, [])

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
