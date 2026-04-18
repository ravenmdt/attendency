import type { CalendarInfoItem } from "../Calendar/calendar.types";
import type { ReportAvailabilityApiRow } from "../../../shared/reports.types";
import type { UserQualification } from "../../../shared/users.types";

export type ReportAvailabilityStatus = "available" | "partial";

export type ReportUserEntry = {
  userId: number;
  name: string;
  qualification: UserQualification;
  imageUrl: string | null;
  availabilityStatus: ReportAvailabilityStatus;
};

export type ReportDayWaveGroups = {
  0: ReportUserEntry[];
  1: ReportUserEntry[];
};

export type ReportAvailabilityByDate = Map<string, ReportDayWaveGroups>;
export type ReportCalendarInfoByDate = Map<string, CalendarInfoItem>;

export type ReportMonthQueryResult = {
  isLoading: boolean;
  isCalendarInfoLoading: boolean;
  error: string;
  availabilityByDate: ReportAvailabilityByDate;
  calendarInfoByDate: ReportCalendarInfoByDate;
};

export type ReportsCalendarProps = {
  selectedDate: string;
  visibleMonth: Date;
  availabilityByDate: ReportAvailabilityByDate;
  onSelectDate: (date: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
};

export type ReportsWavePanelProps = {
  title: string;
  users: ReportUserEntry[];
  accentClassName: string;
  emptyMessage: string;
};

export type ReportsApiRow = ReportAvailabilityApiRow;
