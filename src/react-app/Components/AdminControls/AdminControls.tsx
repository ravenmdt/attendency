import { useAdminControls } from "./useAdminControls";

/*
  AdminControls.tsx

  This component renders the Admin Controls screen itself.
  It stays mostly focused on layout, while the data loading and saving logic
  lives in useAdminControls.ts.
*/

const roleOptions = [
  {
    id: "role-admin",
    name: "Admin",
    description:
      "Admins always have access to the Admin Controls area and this setting cannot be changed here.",
    locked: true,
  },
  {
    id: "role-admin-assistant",
    name: "Admin Assistant",
    description:
      "If enabled, signed-in users with the Admin Assistant role may also see the Admin Controls button in the navigation.",
    locked: false,
  },
  {
    id: "role-user",
    name: "User",
    description:
      "If enabled, signed-in users with the User role may also see the Admin Controls button in the navigation.",
    locked: false,
  },
];

const layoutOptions = [
  {
    id: "layout-show-day-icons",
    name: "Show sun icons",
    description:
      "Display the sun icon on calendar day cells when the date is marked as a daytime shift.",
  },
  {
    id: "layout-show-night-icons",
    name: "Show moon icons",
    description:
      "Display the moon icon on calendar day cells when the date is marked as a night shift.",
  },
];

const checkboxClassName =
  "col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto";

export default function AdminControls() {
  const admin = useAdminControls();

  if (admin.isLoading) {
    return (
      <p className="ui-text-body px-4 py-5 text-sm">
        Loading admin settings...
      </p>
    );
  }

  return (
    <form onSubmit={admin.handleSave}>
      <div className="space-y-6">
        <header>
          <h1 className="ui-text-primary text-2xl font-semibold">
            Admin Controls
          </h1>
          <p className="ui-text-muted mt-1 text-sm">
            Manage project-wide control visibility and shared layout options.
          </p>
        </header>

        {!admin.canEdit ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            View only: only Admin users can change these project-wide settings.
          </p>
        ) : null}

        <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
          <div>
            <h2 className="ui-text-primary text-base font-semibold">
              Admin Control Options
            </h2>
            <p className="ui-text-muted mt-1 text-sm">
              Manage visibility for Admin Controls and the default password used
              during account setup and resets.
            </p>
          </div>

          <fieldset className="mt-6">
            <legend className="ui-text-primary text-sm font-semibold">
              Role visibility for Admin Controls
            </legend>
            <p className="ui-text-muted mt-1 text-sm">
              The navigation uses this saved setting whenever users sign in.
            </p>

            <div className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
              {roleOptions.map((role) => {
                const isChecked =
                  role.name === "Admin"
                    ? true
                    : role.name === "Admin Assistant"
                      ? admin.allowAdminAssistantRoleAdminControls
                      : admin.allowUserRoleAdminControls;
                const isDisabled =
                  role.locked || !admin.canEdit || admin.isSaving;

                return (
                  <div key={role.id} className="relative flex gap-3 py-4">
                    <div className="min-w-0 flex-1 text-sm/6">
                      <label
                        htmlFor={role.id}
                        className="ui-text-primary select-none font-medium"
                      >
                        {role.name}
                      </label>
                      <p className="ui-text-muted mt-1 text-sm">
                        {role.description}
                      </p>
                      {role.locked ? (
                        <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                          Always enabled
                        </p>
                      ) : null}
                    </div>

                    <div className="flex h-6 shrink-0 items-center">
                      <div className="group grid size-4 grid-cols-1">
                        <input
                          checked={isChecked}
                          disabled={isDisabled}
                          id={role.id}
                          name={role.id}
                          type="checkbox"
                          onChange={(event) => {
                            if (role.locked) return;
                            if (role.name === "Admin Assistant") {
                              admin.setAllowAdminAssistantRoleAdminControls(
                                event.target.checked,
                              );
                            } else {
                              admin.setAllowUserRoleAdminControls(
                                event.target.checked,
                              );
                            }
                          }}
                          className={checkboxClassName}
                        />
                        <svg
                          fill="none"
                          viewBox="0 0 14 14"
                          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25"
                        >
                          <path
                            d="M3 8L6 11L11 3.5"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-checked:opacity-100"
                          />
                          <path
                            d="M3 7H11"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-indeterminate:opacity-100"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-white/10">
            <h3 className="ui-text-primary text-sm font-semibold">
              Attendance feed rollover window
            </h3>
            <p className="ui-text-muted mt-1 text-sm">
              Choose how many upcoming days the Reports attendance change feed
              should cover for rollover and copy-forward work.
            </p>

            <div className="mt-4 max-w-xs">
              <label
                htmlFor="attendance-feed-cutoff-days"
                className="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >
                Feed window in days
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
                  <input
                    id="attendance-feed-cutoff-days"
                    name="attendance-feed-cutoff-days"
                    type="number"
                    min={1}
                    max={21}
                    step={1}
                    value={admin.attendanceFeedCutoffDays}
                    disabled={!admin.canEdit || admin.isSaving}
                    onChange={(event) => {
                      const nextValue = Number.parseInt(event.target.value, 10);
                      admin.setAttendanceFeedCutoffDays(
                        Number.isNaN(nextValue) ? 13 : nextValue,
                      );
                    }}
                    className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <p className="ui-text-muted mt-2 text-sm">
                13 days is the recommended default. The Reports page uses this
                saved value dynamically when deciding which future changes to
                show.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-white/10">
            <h3 className="ui-text-primary text-sm font-semibold">
              Default password
            </h3>
            <p className="ui-text-muted mt-1 text-sm">
              This value is used for newly created users and when an operator
              clicks the reset-password action.
            </p>

            <div className="mt-4 max-w-xl">
              <label
                htmlFor="default-password"
                className="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >
                New default password
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
                  <input
                    id="default-password"
                    name="default-password"
                    type="text"
                    value={admin.defaultPassword}
                    disabled={!admin.canEdit || admin.isSaving}
                    onChange={(event) =>
                      admin.setDefaultPassword(event.target.value)
                    }
                    placeholder={
                      admin.defaultPasswordConfigured
                        ? "Enter a new password to replace the current default"
                        : "Create the first default password"
                    }
                    className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <p className="ui-text-muted mt-2 text-sm">
                Leave this blank if you only want to change admin access or
                layout options.
              </p>
            </div>
          </div>
        </section>

        <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
          <div>
            <h2 className="ui-text-primary text-base font-semibold">
              Layout Options
            </h2>
            <p className="ui-text-muted mt-1 text-sm">
              Control how much calendar-info icon detail is shown to users on
              the calendar page.
            </p>
          </div>

          <div className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
            {layoutOptions.map((option) => {
              const isChecked =
                option.id === "layout-show-day-icons"
                  ? admin.showDayIcons
                  : admin.showNightIcons;

              return (
                <div key={option.id} className="relative flex gap-3 py-4">
                  <div className="min-w-0 flex-1 text-sm/6">
                    <label
                      htmlFor={option.id}
                      className="ui-text-primary select-none font-medium"
                    >
                      {option.name}
                    </label>
                    <p className="ui-text-muted mt-1 text-sm">
                      {option.description}
                    </p>
                  </div>

                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        checked={isChecked}
                        disabled={!admin.canEdit || admin.isSaving}
                        id={option.id}
                        name={option.id}
                        type="checkbox"
                        onChange={(event) => {
                          if (option.id === "layout-show-day-icons") {
                            admin.setShowDayIcons(event.target.checked);
                          } else {
                            admin.setShowNightIcons(event.target.checked);
                          }
                        }}
                        className={checkboxClassName}
                      />
                      <svg
                        fill="none"
                        viewBox="0 0 14 14"
                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-checked:opacity-100"
                        />
                        <path
                          d="M3 7H11"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-indeterminate:opacity-100"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between gap-x-6">
          <div>
            {admin.error ? (
              <p className="ui-danger-text text-sm">{admin.error}</p>
            ) : admin.statusMessage ? (
              <p className="ui-text-body text-sm">{admin.statusMessage}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!admin.canEdit || admin.isSaving}
            className="ui-user-edit-save rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {admin.isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
