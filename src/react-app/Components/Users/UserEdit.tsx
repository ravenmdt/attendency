import { UserDeleteDialog } from "./UserDeleteDialog";
import { UserEditProfileSection } from "./UserEditProfileSection";
import { UserEditSettingsSection } from "./UserEditSettingsSection";
import { useUserEditor } from "./useUserEditor";
import type { UserEditMode } from "./userEdit.config";

/*
  UserEdit.tsx

  This file is intentionally small.
  Its job is to assemble the major parts of the user editor screen so a newer
  developer can understand the page flow at a glance.
*/

export type UserEditProps = {
  mode?: UserEditMode;
  userId: number | null;
  onCancel?: () => void;
  onSaveComplete?: () => void;
};

export default function UserEdit({
  mode = "edit",
  userId,
  onCancel,
  onSaveComplete,
}: UserEditProps) {
  const editor = useUserEditor({ mode, userId, onSaveComplete });

  if (editor.isLoading) {
    return (
      <p className="ui-text-body px-4 py-5 text-sm">
        {editor.isCreateMode ? "Loading form..." : "Loading user..."}
      </p>
    );
  }

  return (
    <>
      <form onSubmit={editor.handleSave}>
        {/*
          The main body is split into small visual sections.
          This keeps the page readable without hiding the overall flow.
        */}
        <div className="space-y-6">
          <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
            <UserEditProfileSection
              isCreateMode={editor.isCreateMode}
              username={editor.username}
              imageUrl={editor.imageUrl}
              isResettingPassword={editor.isResettingPassword}
              onUsernameChange={editor.setUsername}
              onResetPassword={editor.handleResetPassword}
            />
          </section>

          <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
            <UserEditSettingsSection
              selectedQualification={editor.selectedQualification}
              selectedRole={editor.selectedRole}
              onQualificationChange={editor.setSelectedQualification}
              onRoleChange={editor.setSelectedRole}
            />
          </section>
        </div>

        {/*
          The footer groups the main actions together so the operator always
          knows where to cancel, save, or delete.
        */}
        <div className="ui-surface ui-border mt-6 flex items-center justify-between gap-x-6 rounded-xl border p-4 sm:p-5">
          <div className="flex items-center gap-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="ui-user-edit-cancel rounded-md px-3 py-2 text-sm/6 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editor.isSaveDisabled}
              className="ui-user-edit-save rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editor.isSaving
                ? editor.isCreateMode
                  ? "Creating..."
                  : "Saving..."
                : editor.isCreateMode
                  ? "Create user"
                  : "Save"}
            </button>
          </div>

          <div className="flex items-center gap-x-4">
            <div>
              {editor.error ? (
                <p className="ui-danger-text text-sm">{editor.error}</p>
              ) : editor.statusMessage ? (
                <p className="ui-text-body text-sm">{editor.statusMessage}</p>
              ) : null}
            </div>

            {!editor.isCreateMode ? (
              <button
                type="button"
                onClick={() => editor.setIsDeleteDialogOpen(true)}
                className="ui-user-edit-delete rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <UserDeleteDialog
        open={editor.isDeleteDialogOpen}
        username={editor.username}
        isDeleting={editor.isDeleting}
        onClose={() => editor.setIsDeleteDialogOpen(false)}
        onConfirmDelete={editor.handleDeleteUser}
      />
    </>
  );
}
