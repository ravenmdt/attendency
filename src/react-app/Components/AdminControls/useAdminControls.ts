import { useEffect, useState } from "react";
import type {
  AdminSettingsResponse,
  AdminSettingsSaveRequest,
  AdminSettingsSaveResponse,
} from "../../../shared/admin.types";
import { useAuth } from "../Auth/AuthContext";

/*
  useAdminControls.ts

  This custom hook contains the behavior for the Admin Controls screen:
  - loading the current server-side settings
  - tracking form state in React
  - saving changes back to the worker API

  By keeping that logic here, the main AdminControls.tsx file can stay focused
  on layout and readability.
*/

export function useAdminControls() {
  const { authenticatedFetch, currentUser, updatePermissions } = useAuth();

  const [allowUserRoleAdminControls, setAllowUserRoleAdminControls] =
    useState(false);
  const [allowAdminAssistantRoleAdminControls, setAllowAdminAssistantRoleAdminControls] =
    useState(false);
  const [showDayIcons, setShowDayIcons] = useState(true);
  const [showNightIcons, setShowNightIcons] = useState(true);
  const [attendanceFeedCutoffDays, setAttendanceFeedCutoffDays] =
    useState(13);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [defaultPasswordConfigured, setDefaultPasswordConfigured] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(currentUser?.role === "Admin");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage(null);

        const response = await authenticatedFetch("/api/admin-settings");
        const body = (await response
          .json()
          .catch(() => null)) as AdminSettingsResponse | null;

        if (!response.ok || !body?.ok) {
          throw new Error(
            body && !body.ok ? body.error : "Failed to load admin settings",
          );
        }

        if (!isMounted) return;

        setAllowUserRoleAdminControls(body.settings.allowUserRoleAdminControls);
        setAllowAdminAssistantRoleAdminControls(
          body.settings.allowAdminAssistantRoleAdminControls,
        );
        setShowDayIcons(body.settings.showDayIcons);
        setShowNightIcons(body.settings.showNightIcons);
        setAttendanceFeedCutoffDays(body.settings.attendanceFeedCutoffDays);
        setDefaultPasswordConfigured(body.settings.defaultPasswordConfigured);
        setCanEdit(body.settings.canEdit);
        setDefaultPassword("");
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load admin settings",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || isSaving) return;

    try {
      setIsSaving(true);
      setError(null);
      setStatusMessage(null);

      // Blank password means: keep the current stored default password as-is.
      const trimmedPassword = defaultPassword.trim();
      const payload: AdminSettingsSaveRequest = {
        allowUserRoleAdminControls,
        allowAdminAssistantRoleAdminControls,
        showDayIcons,
        showNightIcons,
        // Clamp the value client-side so the UI always sends a sane integer,
        // while the server still remains the source of truth for validation.
        attendanceFeedCutoffDays: Math.min(
          21,
          Math.max(1, Math.trunc(attendanceFeedCutoffDays)),
        ),
        ...(trimmedPassword.length > 0
          ? { defaultPassword: trimmedPassword }
          : {}),
      };

      const response = await authenticatedFetch("/api/admin-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response
        .json()
        .catch(() => null)) as AdminSettingsSaveResponse | null;

      if (!response.ok || !body?.ok) {
        throw new Error(
          body && !body.ok ? body.error : "Failed to save admin settings",
        );
      }

      setAllowUserRoleAdminControls(body.settings.allowUserRoleAdminControls);
      setAllowAdminAssistantRoleAdminControls(
        body.settings.allowAdminAssistantRoleAdminControls,
      );
      setShowDayIcons(body.settings.showDayIcons);
      setShowNightIcons(body.settings.showNightIcons);
      setAttendanceFeedCutoffDays(body.settings.attendanceFeedCutoffDays);
      setDefaultPasswordConfigured(body.settings.defaultPasswordConfigured);
      setDefaultPassword("");
      setStatusMessage(body.message);
      updatePermissions({
        canAccessAdminControls:
          currentUser?.role === "Admin"
            ? true
            : currentUser?.role === "Admin Assistant"
              ? body.settings.allowAdminAssistantRoleAdminControls
              : body.settings.allowUserRoleAdminControls,
        showDayIcons: body.settings.showDayIcons,
        showNightIcons: body.settings.showNightIcons,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save admin settings",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    currentUser,
    allowUserRoleAdminControls,
    setAllowUserRoleAdminControls,
    allowAdminAssistantRoleAdminControls,
    setAllowAdminAssistantRoleAdminControls,
    showDayIcons,
    setShowDayIcons,
    showNightIcons,
    setShowNightIcons,
    attendanceFeedCutoffDays,
    setAttendanceFeedCutoffDays,
    defaultPassword,
    setDefaultPassword,
    defaultPasswordConfigured,
    isLoading,
    isSaving,
    error,
    statusMessage,
    canEdit,
    handleSave,
  };
}
