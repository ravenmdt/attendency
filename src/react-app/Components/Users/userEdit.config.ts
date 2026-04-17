import type { UserQualification, UserRole } from "../../../shared/users.types";

/*
  userEdit.config.ts

  This file stores the small shared values used by the user editor.
  Keeping these in one place prevents the main screen component from being
  cluttered with lookup data and helper functions.
*/

export type UserEditMode = "edit" | "create";

export type QualificationOption = {
  id: number;
  name: UserQualification;
};

export type RoleOption = {
  id: number;
  name: UserRole;
};

export type OriginalFormState = {
  name: string;
  qualification: UserQualification;
  role: UserRole;
};

// These arrays drive the dropdown menus shown in the UI.
export const qualificationOptions: QualificationOption[] = [
  { id: 1, name: "NONE" },
  { id: 2, name: "PTT" },
  { id: 3, name: "ACT" },
  { id: 4, name: "PTT TO ACT" },
];

export const roleOptions: RoleOption[] = [
  { id: 1, name: "User" },
  { id: 2, name: "Admin" },
];

// New users start with the safest defaults unless the operator changes them.
export const DEFAULT_QUALIFICATION = qualificationOptions[0]!;
export const DEFAULT_ROLE = roleOptions[0]!;
export const DEFAULT_NEW_USER_PASSWORD = "TigerTiger313#!#";

// Small helper for building className strings without lots of if statements.
export function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
