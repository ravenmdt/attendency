// Shared calendar API contracts used by both frontend and worker.

export type ApiResponse<T> = {
  ok: boolean
  rows: T[]
}

export type AvailabilityApiRow = {
  date: string
  wave: 0 | 1
  available: 0 | 1
}

export type CalendarInfoApiRow = {
  date: string
  nights: 0 | 1
  priority: 0 | 1
  type: string
}

export type AvailabilitySaveChange = {
  date: string
  wave: 0 | 1
  available: boolean | null
}

export type AvailabilitySaveRequest = {
  changes: AvailabilitySaveChange[]
}

export type AvailabilitySaveResponse = {
  ok: boolean
  applied: number
}
