import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useEffect, useMemo, useState } from 'react'
import {
  NightsIcon, 
  PriorityIcon,
  TypeIcon,
 } from './calendar_info_display';

/*
  Database reset commands:
  npm run db:reset:local   — wipe + reseed local D1 (dev)
  npm run db:reset:remote  — wipe + reseed remote D1 (prod)
  npm run cf-typegen       — regenerate worker-configuration.d.ts after wrangler.json changes
*/

/*
  D1 sync strategy used by this calendar:
  1) Keep availability as baseline demo data (what is currently in D1).
  2) Track user clicks as in-memory overrides only (diffs from baseline).
  3) On Save, send only diff rows for date+wave to your worker in one payload.
     - available=true/false => upsert that row
     - available=null       => delete that row (no entry)

  Example D1 queries for save flow:
  -- 1) Read baseline rows for a range
  SELECT date, wave, available
  FROM availability
  WHERE person_id = ?1
    AND date BETWEEN ?2 AND ?3;

  -- 2) Upsert one changed row
  INSERT INTO availability (person_id, date, wave, available)
  VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT(person_id, date, wave)
  DO UPDATE SET available = excluded.available;

  -- 3) Remove row when toggled to no entry
  DELETE FROM availability
  WHERE person_id = ?1
    AND date = ?2
    AND wave = ?3;
*/

// Shape of a row returned by GET /api/calendar-info
type CalendarInfoItem = {
  date: string
  nights: boolean
  priority: boolean
  type: string
}

type AvailabilityWave = 0 | 1
type AvailabilityValue = boolean | null

type AvailabilityItem = {
  date: string
  wave: AvailabilityWave
  available: boolean
}

type AvailabilityOverride = {
  date: string
  wave: AvailabilityWave
  available: AvailabilityValue
}


type EventItem = {
  id: number
  name: string
  time: string
  datetime: string
  href: string
}

type CalendarDay = {
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: EventItem[]
}

function toDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1)
}

function getAvailabilityKey(date: string, wave: AvailabilityWave): string {
  return `${date}|${wave}`
}

function cycleAvailability(value: AvailabilityValue): AvailabilityValue {
  if (value === null) {
    return true
  }

  if (value === true) {
    return false
  }

  return null
}

function buildAvailabilityMap(items: AvailabilityItem[]): Map<string, boolean> {
  const map = new Map<string, boolean>()

  for (const item of items) {
    map.set(getAvailabilityKey(item.date, item.wave), item.available)
  }

  return map
}

function buildMonthDays(month: Date, eventsByDate: Map<string, EventItem[]>): CalendarDay[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const startOffset = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - startOffset)

  const todayKey = toDateKey(new Date())
  const result: CalendarDay[] = []

  for (let i = 0; i < 42; i += 1) {
    const dayDate = new Date(gridStart)
    dayDate.setDate(gridStart.getDate() + i)
    const dayKey = toDateKey(dayDate)
    const isToday = dayKey === todayKey
    const isCurrentMonth = dayDate.getMonth() === month.getMonth() && dayDate.getFullYear() === month.getFullYear()

    result.push({
      date: dayKey,
      isCurrentMonth,
      isToday,
      isSelected: isToday,
      events: eventsByDate.get(dayKey) ?? [],
    })
  }

  return result
}

// Demo user id — replace with real auth session when users are implemented.
const DEMO_USER_ID = 1

export default function Calendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  // User edits are stored as diffs only; unchanged dates are not duplicated in state.
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Map<string, AvailabilityOverride>>(() => new Map())
  // Baseline starts empty; populated by the fetch effect below from D1.
  const [baselineAvailability, setBaselineAvailability] = useState<Map<string, boolean>>(() => new Map())
  // Day-info column data (nights/priority/type) keyed by YYYY-MM-DD.
  const [calendarInfoMap, setCalendarInfoMap] = useState<Map<string, CalendarInfoItem>>(() => new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Fetch availability and calendar_info from D1 once on mount.
  useEffect(() => {
    Promise.all([
      fetch(`/api/availability?userId=${DEMO_USER_ID}`).then((r) => r.json() as Promise<{ ok: boolean; rows: { date: string; wave: 0 | 1; available: 0 | 1 }[] }>),
      fetch(`/api/calendar-info?userId=${DEMO_USER_ID}`).then((r) => r.json() as Promise<{ ok: boolean; rows: { date: string; nights: 0 | 1; priority: 0 | 1; type: string }[] }>),
    ])
      .then(([avail, info]) => {
        // D1 stores booleans as integers; convert to boolean before building maps.
        const items: AvailabilityItem[] = avail.rows.map((r) => ({
          date: r.date,
          wave: r.wave,
          available: Boolean(r.available),
        }))
        setBaselineAvailability(buildAvailabilityMap(items))

        const infoMap = new Map<string, CalendarInfoItem>()
        for (const r of info.rows) {
          infoMap.set(r.date, {
            date: r.date,
            nights: Boolean(r.nights),
            priority: Boolean(r.priority),
            type: r.type,
          })
        }
        setCalendarInfoMap(infoMap)
      })
      .catch((err) => console.error('Failed to load calendar data from D1:', err))
      .finally(() => setIsLoading(false))
  }, []) // Run once on mount

  // Replace this with your custom event data source keyed by YYYY-MM-DD.
  const dayEventsByDate = useMemo(() => new Map<string, EventItem[]>(), [])
  const visibleDays = useMemo(() => buildMonthDays(visibleMonth, dayEventsByDate), [visibleMonth, dayEventsByDate])
  const monthEvents = useMemo(() => visibleDays.flatMap((day) => day.events), [visibleDays])
  // This payload-ready array is what we send to the worker on Save.
  const pendingAvailabilityChanges = useMemo(() => Array.from(availabilityOverrides.values()), [availabilityOverrides])
  const hasPendingChanges = pendingAvailabilityChanges.length > 0
  const [isSaving, setIsSaving] = useState(false)

  const monthTitle = visibleMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const monthDateTime = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}`
  const goToToday = () => {
    const now = new Date()
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  const getEffectiveAvailability = (date: string, wave: AvailabilityWave): AvailabilityValue => {
    const key = getAvailabilityKey(date, wave)
    if (availabilityOverrides.has(key)) {
      // Overrides win over baseline; this is what makes edits immediately visible.
      return availabilityOverrides.get(key)!.available
    }

    const baseline = baselineAvailability.get(key)
    return baseline === undefined ? null : baseline
  }
  const getAvailabilityClass = (value: AvailabilityValue): string => {
    if (value === true) {
      return 'bg-green-500/80 dark:bg-green-500/60'
    }

    if (value === false) {
      return 'bg-red-500/80 dark:bg-red-500/60'
    }

    return 'bg-gray-200/60 dark:bg-gray-700/40'
  }
  const toggleWaveAvailability = (date: string, wave: AvailabilityWave) => {
    setAvailabilityOverrides((current) => {
      const next = new Map(current)
      const key = getAvailabilityKey(date, wave)
      // Important: when override value is null, we still want to read it as a real state.
      // Using `has` avoids falling back to baseline and preserves the 3-state cycle.
      const currentValue = next.has(key) ? next.get(key)!.available : (baselineAvailability.get(key) ?? null)
      const nextValue = cycleAvailability(currentValue)
      const baselineValue = baselineAvailability.get(key) ?? null

      // If user cycles back to baseline, remove diff entry so payload stays minimal.
      if (nextValue === baselineValue) {
        next.delete(key)
      } else {
        next.set(key, { date, wave, available: nextValue })
      }

      return next
    })
  }
  const saveAvailabilityChanges = async () => {
    if (!hasPendingChanges || isSaving) {
      return
    }

    // Frontend wiring point:
    // Send only changed rows so one backend request can persist all edits in one go.
    const d1SavePayload = {
      userId: DEMO_USER_ID,
      changes: pendingAvailabilityChanges,
    }

    try {
      setIsSaving(true)

      const response = await fetch('/api/availability/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(d1SavePayload),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to save availability changes')
      }

      // After successful save, fold diffs into baseline and clear dirty state.
      setBaselineAvailability((current) => {
        const next = new Map(current)

        for (const change of pendingAvailabilityChanges) {
          const key = getAvailabilityKey(change.date, change.wave)
          if (change.available === null) {
            next.delete(key)
          } else {
            next.set(key, change.available)
          }
        }

        return next
      })

      setAvailabilityOverrides(new Map())
    } catch (error) {
      console.error('Availability save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
              onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
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
              onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
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
              {isSaving ? 'Saving...' : `Save changes${hasPendingChanges ? ` (${pendingAvailabilityChanges.length})` : ''}`}
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
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>M</span>
            <span className="sr-only sm:not-sr-only">on</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>T</span>
            <span className="sr-only sm:not-sr-only">ue</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>W</span>
            <span className="sr-only sm:not-sr-only">ed</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>T</span>
            <span className="sr-only sm:not-sr-only">hu</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>F</span>
            <span className="sr-only sm:not-sr-only">ri</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>S</span>
            <span className="sr-only sm:not-sr-only">at</span>
          </div>
          <div className="flex justify-center bg-white py-2 dark:bg-gray-900">
            <span>S</span>
            <span className="sr-only sm:not-sr-only">un</span>
          </div>
        </div>
        <div className="flex bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto dark:bg-white/10 dark:text-gray-300">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
            {visibleDays.map((day) => (
              <div
                key={day.date}
                data-is-today={day.isToday ? '' : undefined}
                data-is-current-month={day.isCurrentMonth ? '' : undefined}
                className="group relative bg-gray-50 px-3 py-2 text-gray-500 data-is-current-month:bg-white dark:bg-gray-900 dark:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:data-is-current-month:bg-gray-900"
              >
                <time
                  dateTime={day.date}
                  className="relative group-not-data-is-current-month:opacity-75 in-data-is-today:flex in-data-is-today:size-6 in-data-is-today:items-center in-data-is-today:justify-center in-data-is-today:rounded-full in-data-is-today:bg-indigo-600 in-data-is-today:font-semibold in-data-is-today:text-white dark:in-data-is-today:bg-indigo-500"
                >
                  {day.date.split('-')[2].replace(/^0/, '')}
                </time>
                {(() => {
                  const att = calendarInfoMap.get(day.date)
                  const wave0 = getEffectiveAvailability(day.date, 0)
                  const wave1 = getEffectiveAvailability(day.date, 1)

                  return (
                    <div className="flex mt-2">
                      <div className="flex-1 flex flex-col text-xs text-gray-900 dark:text-white">
                        {att && (
                          <>
                            <div><NightsIcon nights={att.nights} /></div>
                            <div><PriorityIcon priority={att.priority} /></div>
                            <div><TypeIcon type={att.type} /></div>
                          </>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleWaveAvailability(day.date, 0)}
                          aria-label={`Toggle wave 0 availability for ${day.date}`}
                          title="Wave 0"
                          className={`h-4 w-full rounded-sm ${getAvailabilityClass(wave0)}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleWaveAvailability(day.date, 1)}
                          aria-label={`Toggle wave 1 availability for ${day.date}`}
                          title="Wave 1"
                          className={`h-4 w-full rounded-sm ${getAvailabilityClass(wave1)}`}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
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
                {day.events.length > 0 ? (
                  <span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                    {day.events.map((event) => (
                      <span key={event.id} className="mx-0.5 mb-1 size-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    ))}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="border-b border-gray-200 bg-white/80 px-6 py-3 text-xs text-gray-700 dark:border-white/10 dark:bg-gray-800/40 dark:text-gray-300">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Day Info (First Column)</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white"><NightsIcon nights={true} /></span>
                Night shift
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white"><NightsIcon nights={false} /></span>
                Day shift
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white"><PriorityIcon priority={true} /></span>
                Priority true
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white"><TypeIcon type="ACT" /></span>
                Type code (example)
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">These icons are rendered from calendar_info_display.tsx using the same functions as the day cells.</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Availability (Second Column)</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-green-500/80 dark:bg-green-500/60" />
                W0/W1 Available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-red-500/80 dark:bg-red-500/60" />
                W0/W1 Unavailable
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-gray-200/60 dark:bg-gray-700/40" />
                No entry
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Top bar = Wave 0, bottom bar = Wave 1.</p>
          </div>
        </div>
      </section>
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
