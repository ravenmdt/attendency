import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import { resizeProfileImageFile } from "./profileImage.utils";
import type {
  CurrentUserProfile,
  SaveUserProfilePayload,
  UserProfileResponse,
} from "./userProfile.types";

export function useUserProfile() {
  const { authenticatedFetch, updateCurrentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [initialProfile, setInitialProfile] = useState<CurrentUserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [qualification, setQualification] = useState<CurrentUserProfile["qualification"]>("NONE");
  const [imageUrl, setImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError("");

      const response = await authenticatedFetch("/api/users/me");
      const body = (await response.json().catch(() => null)) as UserProfileResponse | null;

      if (!response.ok || !body?.ok) {
        setError(body && !body.ok ? body.error : "Failed to load profile");
        return;
      }

      setInitialProfile(body.user);
      setUsername(body.user.name);
      setQualification(body.user.qualification);
      setImageUrl(body.user.imageUrl ?? "");
    } catch {
      setError("Network error while loading your profile");
    } finally {
      setIsLoading(false);
    }
  }

  function handleResetForm() {
    setUsername(initialProfile?.name ?? "");
    setQualification(initialProfile?.qualification ?? "NONE");
    setImageUrl(initialProfile?.imageUrl ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setStatusMessage("");
  }

  async function handlePhotoFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    try {
      setIsPreparingImage(true);
      setError("");
      const resizedImageUrl = await resizeProfileImageFile(file);
      setImageUrl(resizedImageUrl);
      setStatusMessage("Photo prepared. Save your profile to keep it.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to prepare the selected photo",
      );
    } finally {
      setIsPreparingImage(false);
    }
  }

  function handleRemovePhoto() {
    setImageUrl("");
    setStatusMessage("Photo removed. Save your profile to keep the change.");
  }

  const wantsPasswordChange = Boolean(
    currentPassword || newPassword || confirmNewPassword,
  );

  const isSaveDisabled = useMemo(() => {
    if (isLoading || isSaving || isPreparingImage) return true;
    if (username.trim().length < 3) return true;

    if (wantsPasswordChange) {
      return !currentPassword || !newPassword || !confirmNewPassword;
    }

    return false;
  }, [
    confirmNewPassword,
    currentPassword,
    isLoading,
    isPreparingImage,
    isSaving,
    newPassword,
    username,
    wantsPasswordChange,
  ]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setError("Fill in all password fields to change your password");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError("New password and confirmation do not match");
        return;
      }
    }

    const payload: SaveUserProfilePayload = {
      name: username.trim(),
      qualification,
      imageUrl: imageUrl.trim(),
      currentPassword,
      newPassword,
      confirmNewPassword,
    };

    try {
      setIsSaving(true);

      const response = await authenticatedFetch("/api/users/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as UserProfileResponse | null;

      if (!response.ok || !body?.ok) {
        setError(body && !body.ok ? body.error : "Failed to save profile");
        return;
      }

      setInitialProfile(body.user);
      setUsername(body.user.name);
      setQualification(body.user.qualification);
      setImageUrl(body.user.imageUrl ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setStatusMessage("Your profile has been updated.");
      updateCurrentUser({
        id: body.user.id,
        name: body.user.name,
        role: body.user.role,
        imageUrl: body.user.imageUrl,
      });
    } catch {
      setError("Network error while saving your profile");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    isLoading,
    isSaving,
    isPreparingImage,
    error,
    statusMessage,
    username,
    qualification,
    imageUrl,
    currentPassword,
    newPassword,
    confirmNewPassword,
    roleLabel: initialProfile?.role ?? "User",
    isSaveDisabled,
    setUsername,
    setQualification,
    setCurrentPassword,
    setNewPassword,
    setConfirmNewPassword,
    handlePhotoFileChange,
    handleRemovePhoto,
    handleResetForm,
    handleSave,
  };
}
