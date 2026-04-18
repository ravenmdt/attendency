import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import type { ReportsWavePanelProps } from "./reports.types";
import { countUsersByStatus } from "./reports.utils";

/*
  ReportsWavePanel

  This small presentational component only renders the people list for one wave.
  Keeping it separate makes Reports.tsx easier to scan for beginners.
*/
export default function ReportsWavePanel({
  title,
  users,
  accentClassName,
  emptyMessage,
}: ReportsWavePanelProps) {
  const availableCount = countUsersByStatus(users, "available");
  const partialCount = countUsersByStatus(users, "partial");

  return (
    <section className="ui-surface ui-border rounded-xl border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="ui-text-primary text-sm font-semibold">{title}</h3>
          <p className="ui-text-muted mt-1 text-xs">
            {availableCount} available • {partialCount} partial
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            accentClassName,
          ].join(" ")}
        >
          {users.length} marked
        </span>
      </div>

      {users.length === 0 ? (
        <p className="ui-text-muted mt-4 text-sm">{emptyMessage}</p>
      ) : (
        <ol className="ui-text-muted mt-4 flex flex-col gap-y-2 text-sm">
          {users.map((user) => (
            <li
              key={`${title}-${user.userId}`}
              className="ui-interactive-soft group flex items-center gap-x-4 rounded-xl px-3 py-2"
            >
              {user.imageUrl ? (
                <img
                  alt=""
                  src={user.imageUrl}
                  className="size-10 flex-none rounded-full object-cover dark:outline dark:-outline-offset-1 dark:outline-white/10"
                />
              ) : (
                <UserCircleIcon
                  aria-hidden="true"
                  className="ui-text-icon size-10 flex-none"
                />
              )}

              <div className="min-w-0 flex-auto">
                <p className="ui-text-primary truncate text-sm font-medium">
                  {user.name}
                </p>
                <p className="ui-text-muted mt-0.5 text-xs">
                  {user.qualification}
                </p>
              </div>

              {/*
                Only show the info icon when this user has saved special
                instructions. The tooltip uses a named Tailwind group
                (group/info) so it appears only when hovering the icon
                itself, not the whole row.
              */}
              {user.specialInstructions ? (
                <span className="group/info relative flex-none">
                  <InformationCircleIcon
                    aria-label="Special instructions"
                    className="ui-action-link size-4 cursor-help"
                  />
                  {/* Tooltip: absolutely positioned above the icon */}
                  <span className="ui-tooltip-panel pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed shadow-lg group-hover/info:block">
                    {user.specialInstructions}
                  </span>
                </span>
              ) : null}

              <span
                className={[
                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                  user.availabilityStatus === "partial"
                    ? "ui-pill-warning"
                    : "ui-pill-success",
                ].join(" ")}
              >
                {user.availabilityStatus === "partial"
                  ? "Partially available"
                  : "Available"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
