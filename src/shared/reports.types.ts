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
  // Nullable because users are not required to set special instructions.
  specialInstructions: string | null;
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

export type AttendanceChangeFeedItem = {
  changeId: number;
  subjectUserId: number;
  subjectUserName: string;
  subjectUserImageUrl: string | null;
  actorUserId: number | null;
  actorUserName: string | null;
  date: string;
  wave: 0 | 1;
  previousAvailable: 0 | 1 | null;
  nextAvailable: 0 | 1 | null;
  action: "created" | "updated" | "cleared";
  accepted: boolean;
  createdAt: number;
};

export type ReportsChangeFeedSuccessResponse = {
  ok: true;
  cutoffDays: number;
  items: AttendanceChangeFeedItem[];
};

export type ReportsChangeFeedErrorResponse = {
  ok: false;
  error: string;
};

export type ReportsMonthResponse =
  | ReportsMonthSuccessResponse
  | ReportsMonthErrorResponse;

export type ReportsChangeFeedResponse =
  | ReportsChangeFeedSuccessResponse
  | ReportsChangeFeedErrorResponse;

export type ReportsChangeFeedMutationSuccessResponse = {
  ok: true;
};

export type ReportsChangeFeedMutationErrorResponse = {
  ok: false;
  error: string;
};

export type ReportsChangeFeedMutationResponse =
  | ReportsChangeFeedMutationSuccessResponse
  | ReportsChangeFeedMutationErrorResponse;
