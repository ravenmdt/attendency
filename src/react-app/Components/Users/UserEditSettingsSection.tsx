import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  classNames,
  qualificationOptions,
  roleOptions,
  type QualificationOption,
  type RoleOption,
} from "./userEdit.config";

/*
  UserEditSettingsSection.tsx

  This component only shows the settings inputs.
  It is intentionally "dumb": values come in through props, and it reports
  user selections back to the parent.
*/

type UserEditSettingsSectionProps = {
  selectedQualification: QualificationOption | null;
  selectedRole: RoleOption | null;
  onQualificationChange: (option: QualificationOption | null) => void;
  onRoleChange: (option: RoleOption | null) => void;
};

export function UserEditSettingsSection({
  selectedQualification,
  selectedRole,
  onQualificationChange,
  onRoleChange,
}: UserEditSettingsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          Settings
        </h2>
        <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
          Adjust these to grant different permissions to this user or adjust
          their preferred SIM control level of difficulty for scheduling
          purposes.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="sm:col-span-4">
          <label
            htmlFor="qualification"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Qualification
          </label>
          <div className="mt-2">
            <Combobox
              as="div"
              value={selectedQualification}
              onChange={onQualificationChange}
            >
              <Label className="sr-only">Qualification</Label>
              <div className="relative mt-2">
                <ComboboxInput
                  className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  readOnly
                  displayValue={(option: QualificationOption | null) =>
                    option?.name ?? ""
                  }
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                  <ChevronDownIcon
                    className="size-5 text-gray-400"
                    aria-hidden="true"
                  />
                </ComboboxButton>

                <ComboboxOptions
                  transition
                  className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                >
                  {qualificationOptions.map((option) => (
                    <ComboboxOption
                      key={option.id}
                      value={option}
                      className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-indigo-500"
                    >
                      <div className="flex items-center">
                        <span
                          className={classNames(
                            "inline-block size-2 shrink-0 rounded-full",
                            selectedQualification?.id === option.id
                              ? "bg-green-400 dark:bg-green-500"
                              : "bg-gray-200 dark:bg-white/20",
                          )}
                          aria-hidden="true"
                        />
                        <span className="ml-3 block truncate">
                          {option.name}
                        </span>
                      </div>
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="role"
            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >
            Role
          </label>
          <div className="mt-2">
            <Combobox as="div" value={selectedRole} onChange={onRoleChange}>
              <Label className="sr-only">Role</Label>
              <div className="relative mt-2">
                <ComboboxInput
                  className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  readOnly
                  displayValue={(option: RoleOption | null) =>
                    option?.name ?? ""
                  }
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                  <ChevronDownIcon
                    className="size-5 text-gray-400"
                    aria-hidden="true"
                  />
                </ComboboxButton>

                <ComboboxOptions
                  transition
                  className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                >
                  {roleOptions.map((option) => (
                    <ComboboxOption
                      key={option.id}
                      value={option}
                      className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-indigo-500"
                    >
                      <div className="flex items-center">
                        <span
                          className={classNames(
                            "inline-block size-2 shrink-0 rounded-full",
                            selectedRole?.id === option.id
                              ? "bg-green-400 dark:bg-green-500"
                              : "bg-gray-200 dark:bg-white/20",
                          )}
                          aria-hidden="true"
                        />
                        <span className="ml-3 block truncate">
                          {option.name}
                        </span>
                      </div>
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
        </div>
      </div>
    </div>
  );
}
