import { UserCircleIcon } from "@heroicons/react/24/solid";

/*
  UserEditProfileSection.tsx

  This component only renders the top "profile" section of the screen.
  It does not know how saving works — it simply shows inputs and buttons.
  That separation makes the UI easier to scan for a newer developer.
*/

type UserEditProfileSectionProps = {
  isCreateMode: boolean;
  username: string;
  imageUrl: string | null;
  isResettingPassword: boolean;
  onUsernameChange: (nextValue: string) => void;
  onResetPassword: () => void;
};

export function UserEditProfileSection({
  isCreateMode,
  username,
  imageUrl,
  isResettingPassword,
  onUsernameChange,
  onResetPassword,
}: UserEditProfileSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          {isCreateMode ? "Add user" : "Profile"}
        </h2>
        <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
          {isCreateMode
            ? "Create a new user profile with the default access settings."
            : "This information will be displayed publicly so be careful what you share."}
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="username"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Username
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
              <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6 dark:text-gray-400"></div>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="janesmith"
                className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="password"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            {isCreateMode ? "Initial password" : "Reset password"}
          </label>

          {isCreateMode ? (
            <div className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700 outline-1 -outline-offset-1 outline-gray-300 dark:bg-white/5 dark:text-gray-200 dark:outline-white/10">
              New users will start with the current default password managed in
              Admin Controls.
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Resetting a password applies the current default from Admin
                Controls.
              </p>
              <button
                type="button"
                onClick={onResetPassword}
                disabled={isResettingPassword}
                className="ui-user-edit-delete rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}
        </div>

        <div className="col-span-full">
          <label
            htmlFor="photo"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Photo
          </label>
          <div className="mt-2 flex items-center gap-x-3">
            {imageUrl ? (
              <img
                alt={username || "User avatar"}
                src={imageUrl}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon
                aria-hidden="true"
                className="size-12 text-gray-300 dark:text-gray-500"
              />
            )}
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
