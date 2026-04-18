import { buildMonthDays, toDateKey } from "../Calendar/calendar.utils";
import type {
  ReportAvailabilityByDate,
  ReportAvailabilityStatus,
  ReportDayWaveGroups,
  ReportsApiRow,
  ReportUserEntry,
} from "./reports.types";

export function getMonthKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getStartOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function getDefaultSelectedDate(visibleMonth: Date): string {
  const today = new Date();
  const todayIsInVisibleMonth =
    today.getFullYear() === visibleMonth.getFullYear() &&
    today.getMonth() === visibleMonth.getMonth();

  return todayIsInVisibleMonth
    ? toDateKey(today)
    : toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
}

export function isDateInMonth(dateKey: string, visibleMonth: Date): boolean {
  return dateKey.startsWith(`${getMonthKey(visibleMonth)}-`);
}

export function buildReportsAvailabilityMap(
  rows: ReportsApiRow[],
): ReportAvailabilityByDate {
  const grouped: ReportAvailabilityByDate = new Map();

  for (const row of rows) {
    const currentDay = grouped.get(row.date) ?? createEmptyWaveGroups();

    currentDay[row.wave].push({
      userId: row.userId,
      name: row.name,
      qualification: row.qualification,
      imageUrl: row.imageUrl,
      availabilityStatus: row.available === 1 ? "available" : "partial",
      // Pass through special instructions so the wave panel can show a tooltip.
      specialInstructions: row.specialInstructions ?? null,
    });

    grouped.set(row.date, currentDay);
  }

  for (const [, waveGroups] of grouped) {
    waveGroups[0].sort(compareReportUsers);
    waveGroups[1].sort(compareReportUsers);
  }

  return grouped;
}

function compareReportUsers(left: ReportUserEntry, right: ReportUserEntry): number {
  if (left.availabilityStatus !== right.availabilityStatus) {
    return left.availabilityStatus === "available" ? -1 : 1;
  }

  return left.name.localeCompare(right.name);
}

export function countUsersByStatus(
  users: ReportUserEntry[],
  status: ReportAvailabilityStatus,
): number {
  return users.filter((user) => user.availabilityStatus === status).length;
}

export function countDayStatuses(waveGroups: ReportDayWaveGroups) {
  const allUsers = [...waveGroups[0], ...waveGroups[1]];

  return {
    availableCount: countUsersByStatus(allUsers, "available"),
    partialCount: countUsersByStatus(allUsers, "partial"),
  };
}

export function createEmptyWaveGroups(): ReportDayWaveGroups {
  return { 0: [], 1: [] };
}

export function formatLongDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(year, month - 1, day);

  return value.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthGrid(visibleMonth: Date) {
  return buildMonthDays(visibleMonth);
}
