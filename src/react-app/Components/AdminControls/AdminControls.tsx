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
    id: "role-user",
    name: "User",
    description:
      "If enabled, signed-in users with the User role may also see the Admin Controls button in the navigation.",
    locked: false,
  },
];

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
      <div className="space-y-12">
        <fieldset>
          {/*
            This top section controls who may see the Admin Controls area.
            The Admin role is always on; the User role can be toggled by an Admin.
          */}
          <legend className="text-base font-semibold text-gray-900 dark:text-white">
            Role visibility for Admin Controls
          </legend>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            The visibility choice is stored on the server and the navigation
            menu reads that value when users sign in.
          </p>

          {!admin.canEdit ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              View only: only Admin users can change these project-wide
              settings.
            </p>
          ) : null}

          <div className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
            {roleOptions.map((role) => {
              const isChecked =
                role.name === "Admin" ? true : admin.allowUserRoleAdminControls;
              const isDisabled =
                role.locked || !admin.canEdit || admin.isSaving;

              return (
                <div key={role.id} className="relative flex gap-3 py-4">
                  <div className="min-w-0 flex-1 text-sm/6">
                    <label
                      htmlFor={role.id}
                      className="font-medium text-gray-900 select-none dark:text-white"
                    >
                      {role.name}
                    </label>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
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
                          admin.setAllowUserRoleAdminControls(
                            event.target.checked,
                          );
                        }}
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
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

        {/*
          This section mirrors the user-edit form style.
          It lets an Admin set a new default password that future user creation
          and reset-password actions will use.
        */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3 dark:border-white/10">
          <div>
            <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
              Default password
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
              This value is used for newly created users and when an operator
              clicks the reset-password action.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
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
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                For security, the current password is not shown here. Leave this
                blank if you only want to change role visibility.
              </p>
            </div>
          </div>
        </div>

        {/*
          The footer uses the same action style as the user editor screen,
          so the save pattern feels familiar throughout the app.
        */}
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
