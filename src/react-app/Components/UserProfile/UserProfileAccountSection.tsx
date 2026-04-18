import type { UserQualification } from "../../../shared/users.types";
import { qualificationOptions } from "../Users/userEdit.config";

type UserProfileAccountSectionProps = {
  username: string;
  qualification: UserQualification;
  roleLabel: string;
  specialInstructions: string;
  onUsernameChange: (nextValue: string) => void;
  onQualificationChange: (nextValue: UserQualification) => void;
  onSpecialInstructionsChange: (value: string) => void;
};

export default function UserProfileAccountSection({
  username,
  qualification,
  roleLabel,
  specialInstructions,
  onUsernameChange,
  onQualificationChange,
  onSpecialInstructionsChange,
}: UserProfileAccountSectionProps) {
  return (
    <div className="ui-divider-soft grid grid-cols-1 gap-x-8 gap-y-10 border-b pb-12 md:grid-cols-3">
      <div>
        <h2 className="ui-text-primary text-base/7 font-semibold">Profile</h2>
        <p className="ui-text-muted mt-1 text-sm/6">
          These settings only update the currently signed-in account.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="profile-username"
            className="ui-text-primary block text-sm/6 font-medium"
          >
            Username
          </label>
          <div className="mt-2">
            <div className="ui-field-shell flex items-center rounded-md pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2">
              <input
                id="profile-username"
                name="profile-username"
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
          <label className="ui-text-primary block text-sm/6 font-medium">
            Role
          </label>
          <div className="ui-field-display mt-2 rounded-md px-3 py-2 text-sm outline-1 -outline-offset-1">
            {roleLabel}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="profile-qualification"
            className="ui-text-primary block text-sm/6 font-medium"
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
              className="ui-field-display block w-full rounded-md px-3 py-2 text-sm outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
            >
              {qualificationOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*
          Special instructions: optional free-text notes shown as a tooltip
          next to this user's name in the Reports panel.
        */}
        <div className="col-span-full">
          <label
            htmlFor="profile-special-instructions"
            className="ui-text-primary block text-sm/6 font-medium"
          >
            Specials
          </label>
          <div className="mt-2">
            <textarea
              id="profile-special-instructions"
              name="profile-special-instructions"
              rows={3}
              value={specialInstructions}
              onChange={(e) => onSpecialInstructionsChange(e.target.value)}
              placeholder="E.g. Partial available 2 days means, pick only 1 please"
              className="ui-field-display block w-full resize-none rounded-md px-3 py-1.5 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
            />
          </div>
          <p className="ui-text-muted mt-2 text-xs">
            Leave blank to show no tooltip in Reports.
          </p>
        </div>
      </div>
    </div>
  );
}
