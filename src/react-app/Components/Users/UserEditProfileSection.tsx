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
        <h2 className="ui-text-primary text-base/7 font-semibold">
          {isCreateMode ? "Add user" : "Profile"}
        </h2>
        <p className="ui-text-muted mt-1 text-sm/6">
          {isCreateMode
            ? "Create a new user profile with the default access settings."
            : "This information will be displayed publicly so be careful what you share."}
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="username"
            className="ui-text-primary block text-sm/6 font-medium"
          >
            Username
          </label>
          <div className="mt-2">
            <div className="ui-field-shell flex items-center rounded-md pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2">
              <div className="ui-text-muted shrink-0 text-base select-none sm:text-sm/6"></div>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="janesmith"
                className="ui-field-input block min-w-0 grow py-1.5 pr-3 pl-1 text-base focus:outline-none sm:text-sm/6"
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="password"
            className="ui-text-primary block text-sm/6 font-medium"
          >
            {isCreateMode ? "Initial password" : "Reset password"}
          </label>

          {isCreateMode ? (
            <div className="ui-field-display mt-2 rounded-md px-3 py-2 text-sm outline-1 -outline-offset-1">
              New users will start with the current default password managed in
              Admin Controls.
            </div>
          ) : (
            <>
              <p className="ui-text-muted mb-2 text-sm">
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
            className="ui-text-primary block text-sm/6 font-medium"
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
                className="ui-text-icon size-12"
              />
            )}
            <button
              type="button"
              className="ui-secondary-button rounded-md px-3 py-2 text-sm font-semibold inset-ring focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
