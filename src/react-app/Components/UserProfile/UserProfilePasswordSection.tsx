type UserProfilePasswordSectionProps = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  onCurrentPasswordChange: (nextValue: string) => void;
  onNewPasswordChange: (nextValue: string) => void;
  onConfirmNewPasswordChange: (nextValue: string) => void;
};

export default function UserProfilePasswordSection({
  currentPassword,
  newPassword,
  confirmNewPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
}: UserProfilePasswordSectionProps) {
  return (
    <div className="ui-divider-soft grid grid-cols-1 gap-x-8 gap-y-10 border-b pb-12 md:grid-cols-3">
      <div>
        <h2 className="ui-text-primary text-base/7 font-semibold">
          Change password
        </h2>
        <p className="ui-text-muted mt-1 text-sm/6">
          Leave these fields blank if you do not want to change your password.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="current-password"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Current password
          </label>
          <input
            id="current-password"
            name="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
            className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          />
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="new-password"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            New password
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          />
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="confirm-new-password"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            name="confirm-new-password"
            type="password"
            value={confirmNewPassword}
            onChange={(event) => onConfirmNewPasswordChange(event.target.value)}
            className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
