import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import type { AppView } from "./nav.types";

/*
  useAppNavigation.ts

  This custom hook contains the sidebar behavior:
  - which view is currently selected
  - whether the mobile sidebar is open
  - how logout behaves

  By moving that logic here, the page component stays smaller and easier to read.
*/

type UseAppNavigationArgs = {
  defaultView?: AppView;
  onViewChange?: (view: AppView) => void;
};

export function useAppNavigation({
  defaultView = "Dashboard",
  onViewChange,
}: UseAppNavigationArgs = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(defaultView);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Called whenever the user picks a new section from the sidebar.
  function selectView(view: AppView) {
    setCurrentView(view);
    setSidebarOpen(false);
    onViewChange?.(view);
  }

  // Shared logout handler used by both the mobile and desktop nav.
  async function handleLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
      setSidebarOpen(false);
    }
  }

  return {
    sidebarOpen,
    setSidebarOpen,
    currentView,
    selectView,
    isLoggingOut,
    handleLogout,
  };
}
