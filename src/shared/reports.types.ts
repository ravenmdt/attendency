import type { UserQualification } from "./users.types";

// Shared report API contracts used by both the React app and the Worker.

export type ReportAvailabilityApiRow = {
  date: string;
  wave: 0 | 1;
  available: 0 | 1;
  userId: number;
  name: string;
  qualification: UserQualification;
  imageUrl: string | null;
};

export type ReportsMonthSuccessResponse = {
  ok: true;
  month: string;
  rows: ReportAvailabilityApiRow[];
};

export type ReportsMonthErrorResponse = {
  ok: false;
  error: string;
};

export type ReportsMonthResponse =
  | ReportsMonthSuccessResponse
  | ReportsMonthErrorResponse;
