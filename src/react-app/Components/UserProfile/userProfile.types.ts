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
};
