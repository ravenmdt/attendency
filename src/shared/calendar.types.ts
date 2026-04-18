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
  type: CalendarInfoType
}

export type CalendarInfoType = "PTT" | "ACT"

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

export type CalendarInfoSaveChange = {
  date: string
  nights: 0 | 1
  priority: 0 | 1
  type: CalendarInfoType
}

export type CalendarInfoSaveRequest = {
  changes: CalendarInfoSaveChange[]
}

export type CalendarInfoSaveResponse = {
  ok: boolean
  applied: number
}
