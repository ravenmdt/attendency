import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import type {
  UserCreateResponse,
  UserDeleteResponse,
  UserDetailResponse,
  UserListApiRow,
  UserPasswordResetResponse,
  UserSaveResponse,
} from "../../../shared/users.types";
import {
  DEFAULT_QUALIFICATION,
  DEFAULT_ROLE,
  qualificationOptions,
  roleOptions,
  type OriginalFormState,
  type QualificationOption,
  type RoleOption,
  type UserEditMode,
} from "./userEdit.config";

/*
  useUserEditor.ts

  This custom hook contains the "behavior" of the screen:
  - loading a user
  - creating or saving changes
  - resetting the password
  - deleting the user
  - tracking whether the form is dirty

  By moving that logic here, the main UI file can stay small and easier to read.
*/

type UseUserEditorArgs = {
  mode?: UserEditMode;
  userId: number | null;
  onSaveComplete?: () => void;
};

export function useUserEditor({
  mode = "edit",
  userId,
  onSaveComplete,
}: UseUserEditorArgs) {
  const isCreateMode = mode === "create";
  const navigate = useNavigate();
  const { logout, authenticatedFetch } = useAuth();

  // Form field state.
  const [username, setUsername] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedQualification, setSelectedQualification] =
    useState<QualificationOption | null>(DEFAULT_QUALIFICATION);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(
    DEFAULT_ROLE,
  );

  // UI state.
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // We keep a snapshot of the original values so we can detect real changes.
  const [originalFormState, setOriginalFormState] =
    useState<OriginalFormState | null>(null);

  const normalizedUsername = username.trim();

  const hasChanges =
    !isCreateMode &&
    originalFormState !== null &&
    (normalizedUsername !== originalFormState.name ||
      selectedQualification?.name !== originalFormState.qualification ||
      selectedRole?.name !== originalFormState.role);

  const isSaveDisabled =
    isSaving ||
    !selectedQualification ||
    !selectedRole ||
    normalizedUsername.length === 0 ||
    (!isCreateMode && !hasChanges);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      // Create mode starts from blank/default values instead of fetching from the API.
      if (isCreateMode) {
        if (!isMounted) return;
        setIsLoading(false);
        setError(null);
        setStatusMessage(null);
        setUsername("");
        setImageUrl(null);
        setSelectedQualification(DEFAULT_QUALIFICATION);
        setSelectedRole(DEFAULT_ROLE);
        setOriginalFormState(null);
        return;
      }

      if (userId === null) {
        if (!isMounted) return;
        setError("No user selected");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage(null);

        const response = await authenticatedFetch(`/api/users/${userId}`);
        const body = (await response
          .json()
          .catch(() => null)) as UserDetailResponse | null;

        if (!response.ok || !body?.ok) {
          throw new Error(body && !body.ok ? body.error : "Failed to load user");
        }

        if (!isMounted) return;

        const user: UserListApiRow = body.user;
        setUsername(user.name);
        setImageUrl(user.imageUrl ?? null);
        setOriginalFormState({
          name: user.name.trim(),
          qualification: user.qualification,
          role: user.role,
        });
        setSelectedQualification(
          qualificationOptions.find((option) => option.name === user.qualification) ??
            DEFAULT_QUALIFICATION,
        );
        setSelectedRole(
          roleOptions.find((option) => option.name === user.role) ?? DEFAULT_ROLE,
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [authenticatedFetch, isCreateMode, userId]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedQualification || !selectedRole || normalizedUsername.length === 0) {
      return;
    }
    if (!isCreateMode && (userId === null || !hasChanges)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setStatusMessage(null);

      // The same save function is used for both create and edit modes.
      const response = await authenticatedFetch(
        isCreateMode ? "/api/users" : `/api/users/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isCreateMode
              ? {
                  name: normalizedUsername,
                  qualification: selectedQualification.name,
                  role: selectedRole.name,
                }
              : {
                  name: normalizedUsername,
                  qualification: selectedQualification.name,
                  role: selectedRole.name,
                },
          ),
        },
      );

      const body = (await response
        .json()
        .catch(() => null)) as UserSaveResponse | UserCreateResponse | null;

      if (!response.ok || !body?.ok) {
        throw new Error(body && !body.ok ? body.error : "Failed to save user");
      }

      // Update the local form so it matches the new server truth.
      setUsername(body.user.name);
      setImageUrl(body.user.imageUrl ?? null);
      setSelectedQualification(
        qualificationOptions.find((option) => option.name === body.user.qualification) ??
          DEFAULT_QUALIFICATION,
      );
      setSelectedRole(
        roleOptions.find((option) => option.name === body.user.role) ?? DEFAULT_ROLE,
      );
      setOriginalFormState({
        name: body.user.name.trim(),
        qualification: body.user.qualification,
        role: body.user.role,
      });

      setStatusMessage(isCreateMode ? "User created." : "User details saved.");
      onSaveComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPassword() {
    if (userId === null) return;

    try {
      setIsResettingPassword(true);
      setError(null);
      setStatusMessage(null);

      const response = await authenticatedFetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      });
      const body = (await response
        .json()
        .catch(() => null)) as UserPasswordResetResponse | null;

      if (!response.ok || !body?.ok) {
        throw new Error(body && !body.ok ? body.error : "Failed to reset password");
      }

      setStatusMessage(body.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleDeleteUser() {
    if (isCreateMode || userId === null) return;

    try {
      setIsDeleting(true);
      setError(null);
      setStatusMessage(null);

      const response = await authenticatedFetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const body = (await response
        .json()
        .catch(() => null)) as UserDeleteResponse | null;

      if (!response.ok || !body?.ok) {
        throw new Error(body && !body.ok ? body.error : "Failed to delete user");
      }

      setIsDeleteDialogOpen(false);

      // If the deleted person is the current browser user, force a full logout.
      if (body.deletedCurrentUser) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }

      onSaveComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    isCreateMode,
    username,
    setUsername,
    imageUrl,
    selectedQualification,
    setSelectedQualification,
    selectedRole,
    setSelectedRole,
    isLoading,
    isSaving,
    isResettingPassword,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    error,
    statusMessage,
    isSaveDisabled,
    handleSave,
    handleResetPassword,
    handleDeleteUser,
  };
}
