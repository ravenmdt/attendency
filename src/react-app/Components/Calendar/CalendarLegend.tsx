import { NightsIcon, PriorityIcon, TypeIcon } from "./calendar_info_display";
import { availabilityColorClass } from "./calendar.utils";

// ─── CalendarLegend ───────────────────────────────────────────────────────────
//
// Reusable legend panel for the calendar UI.
// Why this exists:
// 1) Keeps Calendar.tsx smaller and easier to read.
// 2) Allows reusing the same legend in other calendar pages/views.
// 3) Uses the same icon/colour helpers as the cells, so the legend always
//    stays in sync with what users see in the grid.
export default function CalendarLegend() {
  return (
    <section className="ui-calendar-legend border-b px-6 py-3 text-xs">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide ui-text-muted">
            Day Info (First Column)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold ui-text-primary">
                <NightsIcon nights={true} />
              </span>
              Night shift
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold ui-text-primary">
                <NightsIcon nights={false} />
              </span>
              Day shift
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold ui-text-primary">
                <PriorityIcon priority={true} />
              </span>
              Priority true
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold ui-text-primary">
                <TypeIcon type="ACT" />
              </span>
              Type code (example)
            </span>
          </div>
          <p className="mt-2 text-[11px] ui-text-muted">
            These icons are rendered from calendar_info_display.tsx using the
            same functions as the day cells.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide ui-text-muted">
            Availability (Second Column)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* availabilityColorClass() keeps legend colours in sync with the actual day cells */}
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-3 w-5 rounded-sm ${availabilityColorClass(true)}`}
              />
              W1/W2 Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-3 w-5 rounded-sm ${availabilityColorClass(false)}`}
              />
              W1/W2 Partially available
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-3 w-5 rounded-sm ${availabilityColorClass(null)}`}
              />
              W1/W2 No entry / not available
            </span>
          </div>
          <p className="mt-2 text-[11px] ui-text-muted">
            Top bar = Wave 1, bottom bar = Wave 2.
          </p>
        </div>
      </div>
    </section>
  );
}
