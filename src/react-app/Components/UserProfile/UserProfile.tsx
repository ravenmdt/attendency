import UserProfileAccountSection from "./UserProfileAccountSection";
import UserProfilePasswordSection from "./UserProfilePasswordSection";
import UserProfilePhotoSection from "./UserProfilePhotoSection";
import { useUserProfile } from "./useUserProfile";

/*
  UserProfile.tsx

  This is the main screen for the signed-in person's own account settings.
  It intentionally mirrors the same visual structure as the admin user editor,
  but all changes are limited to the currently logged-in account.
*/

export default function UserProfile() {
  const profile = useUserProfile();

  if (profile.isLoading) {
    return <p className="ui-text-body px-4 py-5 text-sm">Loading profile...</p>;
  }

  return (
    <form onSubmit={profile.handleSave}>
      <div className="space-y-12">
        <UserProfileAccountSection
          username={profile.username}
          qualification={profile.qualification}
          roleLabel={profile.roleLabel}
          onUsernameChange={profile.setUsername}
          onQualificationChange={profile.setQualification}
        />

        <UserProfilePasswordSection
          currentPassword={profile.currentPassword}
          newPassword={profile.newPassword}
          confirmNewPassword={profile.confirmNewPassword}
          onCurrentPasswordChange={profile.setCurrentPassword}
          onNewPasswordChange={profile.setNewPassword}
          onConfirmNewPasswordChange={profile.setConfirmNewPassword}
        />

        <UserProfilePhotoSection
          username={profile.username}
          imageUrl={profile.imageUrl}
          isPreparingImage={profile.isPreparingImage}
          onPhotoFileChange={profile.handlePhotoFileChange}
          onRemovePhoto={profile.handleRemovePhoto}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-x-6">
        <div className="flex items-center gap-x-4">
          <button
            type="button"
            onClick={profile.handleResetForm}
            className="ui-user-edit-cancel rounded-md px-3 py-2 text-sm/6 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={profile.isSaveDisabled}
            className="ui-user-edit-save rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profile.isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div>
          {profile.error ? (
            <p className="ui-danger-text text-sm">{profile.error}</p>
          ) : profile.statusMessage ? (
            <p className="ui-text-body text-sm">{profile.statusMessage}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
