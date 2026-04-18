import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChartBarSquareIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../Auth/AuthContext";

/*
  Dashboard.tsx

  This is the top-level dashboard screen shown after login.
  Its job is to assemble the smaller dashboard sections into one readable page.

  The dashboard is also the default landing view inside the app shell, so users
  arrive here first and can return here anytime from the navigation menu.
*/

const DASHBOARD_SECTIONS = [
  {
    title: "Team",
    description:
      "View the current accounts, qualifications, and team access setup.",
    icon: UsersIcon,
    accentClassName:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    title: "Calendar",
    description:
      "Mark your day-by-day and wave-by-wave availability for scheduling.",
    icon: CalendarDaysIcon,
    accentClassName:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  {
    title: "Reports",
    description:
      "Review saved attendance, planning details, and recent change activity.",
    icon: ChartBarSquareIcon,
    accentClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    title: "Profile",
    description:
      "Manage your qualification comfort level, password, and profile picture.",
    icon: UserCircleIcon,
    accentClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    title: "Feedback",
    description:
      "Share ideas, issues, and follow-up requests with the wider team.",
    icon: ChatBubbleLeftRightIcon,
    accentClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
] as const;

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ui-text-primary text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your starting point for attendance updates, team visibility, and
          shared planning information.
        </p>
      </header>

      {/*
        Hero card:
        Gives the page a stronger visual anchor while still using the same card
        surface language that appears across Reports and Admin Controls.
      */}
      <section className="ui-surface ui-border overflow-hidden rounded-xl border">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {currentUser?.role ?? "User"}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-300">
                Shared attendance workspace
              </span>
            </div>

            <h2 className="ui-text-primary mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {currentUser ? `Welcome, ${currentUser.name}` : "Welcome"}
            </h2>
            <p className="ui-text-body mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Use this app to submit availability efficiently, review current
              planning data, and keep coordination visible across the team.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="ui-text-primary text-sm font-semibold">
                  Best experience
                </p>
                <div className="mt-2 flex items-start gap-3">
                  <ComputerDesktopIcon className="mt-0.5 size-5 text-indigo-500 dark:text-indigo-300" />
                  <p className="ui-text-muted text-sm">
                    A desktop browser is still recommended for the clearest
                    scheduling workflow.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="ui-text-primary text-sm font-semibold">
                  Quick reminder
                </p>
                <p className="ui-text-muted mt-2 text-sm">
                  Update both waves in the calendar so Reports reflects your
                  latest attendance correctly.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-6 sm:p-8 lg:border-t-0 lg:border-l dark:border-white/10 dark:bg-white/5">
            <h3 className="ui-text-primary text-sm font-semibold">
              Getting started
            </h3>
            <ul className="ui-text-muted mt-4 space-y-3 text-sm">
              <li className="rounded-lg bg-white px-3 py-2 dark:bg-black/10">
                1. Open Calendar and set your availability.
              </li>
              <li className="rounded-lg bg-white px-3 py-2 dark:bg-black/10">
                2. Check Reports for saved day and wave coverage.
              </li>
              <li className="rounded-lg bg-white px-3 py-2 dark:bg-black/10">
                3. Use Feedback for ideas and follow-up requests.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/*
        Section cards:
        These lightweight cards make the main navigation areas easier to scan at
        a glance without changing the underlying workflow of the app.
      */}
      <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
        <div>
          <h2 className="ui-text-primary text-base font-semibold">
            Navigate the workspace
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Each section supports a different part of the planning cycle.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_SECTIONS.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      "inline-flex rounded-lg p-2",
                      section.accentClassName,
                    ].join(" ")}
                  >
                    <Icon className="size-5" />
                  </span>

                  <div>
                    <h3 className="ui-text-primary text-sm font-semibold">
                      {section.title}
                    </h3>
                    <p className="ui-text-muted mt-1 text-sm leading-6">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
