import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useMemo, useState } from 'react'
import type { AvailabilityOverride, AvailabilityValue, AvailabilityWave } from './calendar.types'
import {
  buildMonthDays,
  cycleAvailability,
  getAvailabilityKey,
  shiftMonth,
} from './calendar.utils'
import { useCalendarData } from './useCalendarData'
import { CalendarDayCell } from './CalendarDayCell'
import CalendarLegend from './CalendarLegend'
import type { AvailabilitySaveRequest } from '../../../shared/calendar.types'

/*
  Database reset commands:
  npm run db:reset:local   — wipe + reseed local D1 (dev)
  npm run db:reset:remote  — wipe + reseed remote D1 (prod)
  npm run cf-typegen       — regenerate worker-configuration.d.ts after wrangler.json changes
*/

/*
  D1 sync strategy used by this calendar:
  1) On mount, fetch the current availability rows from D1 into `baselineAvailability`.
  2) User edits are stored only as in-memory "overrides" (diffs), not the full table.
  3) On Save, send only the changed rows to the worker in one request.
     - available=true/false → upsert the row in D1
     - available=null       → delete the row from D1 (no entry)

  Worker implementation lives in src/worker/index.ts.
*/

export default function Calendar() {
  // ── State ─────────────────────────────────────────────────────────────────

  // The first day of whichever month is currently displayed in the grid.
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Only stores cells the user has changed since the last save.
  // Key = "YYYY-MM-DD|wave". Map gives O(1) lookups per cell during rendering.
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Map<string, AvailabilityOverride>>(
    () => new Map()
  )

  const [isSaving, setIsSaving] = useState(false)

  // Custom hook that loads availability + calendar_info from D1 on first render.
  // `applyChanges` merges saved diffs into the baseline after a successful save.
  const { baselineAvailability, calendarInfoMap, isLoading, applyChanges } = useCalendarData()

  // ── Derived values ─────────────────────────────────────────────────────────

  // useMemo caches a computed value until its dependencies change, preventing
  // expensive recalculations on every re-render caused by unrelated state updates.

  // The 42 CalendarDay objects (7 columns × 6 rows) for the currently visible month.
  const visibleDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth])

  // All events across the visible month, used by the mobile event list below the grid.
  const monthEvents = useMemo(() => visibleDays.flatMap((day) => day.events), [visibleDays])

  // Flat array of override entries, ready to be sent as the save payload.
  const pendingChanges = useMemo(
    () => Array.from(availabilityOverrides.values()),
    [availabilityOverrides]
  )

  const hasPendingChanges = pendingChanges.length > 0

  const monthTitle = visibleMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const monthDateTime = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}`

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Jump the visible month back to the user's current month.
  function goToToday() {
    const now = new Date()
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  // Returns what to display for a wave cell — an unsaved edit wins over the D1 baseline.
  // This is what makes edits feel instant even before they are saved.
  function getEffectiveAvailability(date: string, wave: AvailabilityWave): AvailabilityValue {
    const key = getAvailabilityKey(date, wave)
    // `has` must be used here (not `??`) because null is a valid override value
    // that means "delete this row". Using ?? would confuse null with "no override at all".
    if (availabilityOverrides.has(key)) {
      return availabilityOverrides.get(key)!.available
    }
    const baseline = baselineAvailability.get(key)
    return baseline === undefined ? null : baseline
  }

  // Cycles the availability state for one wave on one date when the user clicks a bar.
  function toggleWaveAvailability(date: string, wave: AvailabilityWave) {
    setAvailabilityOverrides((current) => {
      const next = new Map(current)
      const key  = getAvailabilityKey(date, wave)
      // Read current value: prefer override (use `has` not `??`), then fall back to baseline.
      const currentValue: AvailabilityValue = next.has(key)
        ? next.get(key)!.available
        : (baselineAvailability.get(key) ?? null)
      const nextValue     = cycleAvailability(currentValue)
      const baselineValue = baselineAvailability.get(key) ?? null
      if (nextValue === baselineValue) {
        // User cycled back to the saved value — drop the override so the
        // save payload only contains genuinely changed rows.
        next.delete(key)
      } else {
        next.set(key, { date, wave, available: nextValue })
      }
      return next
    })
  }

  // POSTs all pending overrides to the worker, which writes them to D1 in one batch.
  async function saveAvailabilityChanges() {
    if (!hasPendingChanges || isSaving) return
    try {
      setIsSaving(true)
      const response = await fetch('/api/availability/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        // userId is no longer sent. The backend uses session cookie identity.
        body: JSON.stringify({ changes: pendingChanges } as AvailabilitySaveRequest),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Save failed')
      }
      // Merge the saved overrides into the baseline — they are now persisted in D1.
      applyChanges(pendingChanges)
      // Clear the override map — there are no longer any unsaved edits.
      setAvailabilityOverrides(new Map())
    } catch (error) {
      console.error('Availability save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Show a loading placeholder while D1 data is being fetched on first render.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-gray-500 dark:text-gray-400">
        Loading calendar data…
      </div>
    )
  }

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none dark:border-white/10 dark:bg-gray-800/50">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">
          <time dateTime={monthDateTime}>{monthTitle}</time>
        </h1>
        <div className="flex items-center">
          <div className="relative flex items-center rounded-md bg-white shadow-xs outline -outline-offset-1 outline-gray-300 md:items-stretch dark:bg-white/10 dark:shadow-none dark:outline-white/5">
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => shiftMonth(m, -1))}
              className="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="hidden px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:text-white dark:hover:bg-white/10"
            >
              Today
            </button>
            <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-white/10" />
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => shiftMonth(m, 1))}
              className="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="hidden md:ml-4 md:flex md:items-center">
            <Menu as="div" className="relative">
              <MenuButton
                type="button"
                className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
              >
                Month view
                <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400 dark:text-gray-500" />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10"
              >
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                    >
                      Day view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                    >
                      Week view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                    >
                      Month view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                    >
                      Year view
                    </a>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
            <div className="ml-6 h-6 w-px bg-gray-300 dark:bg-white/10" />
            <button
              type="button"
              onClick={saveAvailabilityChanges}
              disabled={!hasPendingChanges || isSaving}
              className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:hover:bg-indigo-300 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 dark:disabled:bg-indigo-900"
            >
              {isSaving ? 'Saving...' : `Save changes${hasPendingChanges ? ` (${pendingChanges.length})` : ''}`}
            </button>
          </div>
          <Menu as="div" className="relative ml-6 md:hidden">
            <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
              <span className="sr-only">Open menu</span>
              <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:divide-white/10 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10"
            >
              <div className="py-1">
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Create event
                  </a>
                </MenuItem>
              </div>
              <div className="py-1">
                <MenuItem>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Go to today
                  </button>
                </MenuItem>
              </div>
              <div className="py-1">
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Day view
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Week view
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Month view
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                  >
                    Year view
                  </a>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </header>
      <div className="shadow-sm ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col dark:shadow-none dark:ring-white/5">
        <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none dark:border-white/5 dark:bg-white/15 dark:text-gray-300">
          {/* sr-only = visible to screen readers but hidden on mobile; shown in full on sm+ */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="flex justify-center bg-white py-2 dark:bg-gray-900">
              <span>{day[0]}</span>
              <span className="sr-only sm:not-sr-only">{day.slice(1)}</span>
            </div>
          ))}
        </div>
        <div className="flex bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto dark:bg-white/10 dark:text-gray-300">
          {/* Desktop grid: full cells with day info + availability bars (lg screens and up) */}
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
            {visibleDays.map((day) => (
              <CalendarDayCell
                key={day.date}
                day={day}
                info={calendarInfoMap.get(day.date)}
                wave0={getEffectiveAvailability(day.date, 0)}
                wave1={getEffectiveAvailability(day.date, 1)}
                onToggle={toggleWaveAvailability}
              />
            ))}
          </div>
          {/* Mobile grid: compact buttons, one per day (hidden on lg screens) */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden">
            {visibleDays.map((day) => (
              <button
                key={day.date}
                type="button"
                data-is-today={day.isToday ? '' : undefined}
                data-is-selected={day.isSelected ? '' : undefined}
                data-is-current-month={day.isCurrentMonth ? '' : undefined}
                className="group relative flex h-14 flex-col px-3 py-2 not-data-is-current-month:bg-gray-50 not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-500 hover:bg-gray-100 focus:z-10 data-is-current-month:bg-white not-data-is-selected:data-is-current-month:not-data-is-today:text-gray-900 data-is-current-month:hover:bg-gray-100 data-is-selected:font-semibold data-is-selected:text-white data-is-today:font-semibold not-data-is-selected:data-is-today:text-indigo-600 dark:not-data-is-current-month:bg-gray-900 dark:not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:hover:bg-gray-900/50 dark:data-is-current-month:bg-gray-900 dark:not-data-is-selected:data-is-current-month:not-data-is-today:text-white dark:data-is-current-month:hover:bg-gray-900/50 dark:not-data-is-selected:data-is-today:text-indigo-400"
              >
                <time
                  dateTime={day.date}
                  className="ml-auto group-not-data-is-current-month:opacity-75 in-data-is-selected:flex in-data-is-selected:size-6 in-data-is-selected:items-center in-data-is-selected:justify-center in-data-is-selected:rounded-full in-data-is-selected:not-in-data-is-today:bg-gray-900 in-data-is-selected:in-data-is-today:bg-indigo-600 dark:in-data-is-selected:not-in-data-is-today:bg-white dark:in-data-is-selected:not-in-data-is-today:text-gray-900 dark:in-data-is-selected:in-data-is-today:bg-indigo-500"
                >
                  {day.date.split('-')[2].replace(/^0/, '')}
                </time>
                <span className="sr-only">{day.events.length} events</span>
                {/* Use && instead of ternary — React renders nothing for `false` */}
                {day.events.length > 0 && (
                  <span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                    {day.events.map((event) => (
                      <span key={event.id} className="mx-0.5 mb-1 size-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    ))}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Legend extracted into its own component for reuse across calendar views. */}
      <CalendarLegend />
      <div className="relative px-4 py-10 sm:px-6 lg:hidden dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:top-0 dark:after:h-px dark:after:bg-white/10">
        <ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow-sm outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          {monthEvents.map((event) => (
            <li
              key={event.id}
              className="group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50 dark:focus-within:bg-white/5 dark:hover:bg-white/5"
            >
              <div className="flex-auto">
                <p className="font-semibold text-gray-900 dark:text-white">{event.name}</p>
                <time dateTime={event.datetime} className="mt-2 flex items-center text-gray-700 dark:text-gray-300">
                  <ClockIcon aria-hidden="true" className="mr-2 size-5 text-gray-400 dark:text-gray-500" />
                  {event.time}
                </time>
              </div>
              <a
                href={event.href}
                className="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-xs ring-1 ring-gray-300 ring-inset group-hover:opacity-100 hover:ring-gray-400 focus:opacity-100 dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/5 dark:hover:bg-white/20 dark:hover:ring-white/5"
              >
                Edit<span className="sr-only">, {event.name}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
