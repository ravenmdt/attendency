import type { UserQualification } from "../../../shared/users.types";
import { qualificationOptions } from "../Users/userEdit.config";

type UserProfileAccountSectionProps = {
  username: string;
  qualification: UserQualification;
  roleLabel: string;
  onUsernameChange: (nextValue: string) => void;
  onQualificationChange: (nextValue: UserQualification) => void;
};

export default function UserProfileAccountSection({
  username,
  qualification,
  roleLabel,
  onUsernameChange,
  onQualificationChange,
}: UserProfileAccountSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3 dark:border-white/10">
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          Profile
        </h2>
        <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
          These settings only update the currently signed-in account.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="profile-username"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Username
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500">
              <input
                id="profile-username"
                name="profile-username"
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
          <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">
            Role
          </label>
          <div className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700 outline-1 -outline-offset-1 outline-gray-300 dark:bg-white/5 dark:text-gray-200 dark:outline-white/10">
            {roleLabel}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="profile-qualification"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Qualification
          </label>
          <div className="mt-2">
            <select
              id="profile-qualification"
              name="profile-qualification"
              value={qualification}
              onChange={(event) =>
                onQualificationChange(event.target.value as UserQualification)
              }
              className="block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
            >
              {qualificationOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
