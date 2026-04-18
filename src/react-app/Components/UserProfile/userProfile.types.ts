import type {
  UserQualification,
  UserRole,
} from "../../../shared/users.types";

export type CurrentUserProfile = {
  id: number;
  name: string;
  qualification: UserQualification;
  role: UserRole;
  imageUrl: string | null;
  lastLoginAt: number | null;
  isOnline: boolean;
  // Free-text notes shown as a tooltip in Reports. null if not yet set.
  specialInstructions: string | null;
};

export type UserProfileResponse =
  | {
      ok: true;
      user: CurrentUserProfile;
    }
  | {
      ok: false;
      error: string;
    };

export type SaveUserProfilePayload = {
  name: string;
  qualification: UserQualification;
  imageUrl: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  // The user's own notes. An empty string means "clear the instructions".
  specialInstructions: string;
};
