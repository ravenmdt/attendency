"use client";

import { useEffect, useState } from "react";
import AdminControls from "../Components/AdminControls/AdminControls";
import Calendar from "../Components/Calendar/Calendar";
import Dashboard from "../Components/Dashboard/Dashboard";
import NavDesktopSidebar from "../Components/Nav/NavDesktopSidebar";
import NavMobileSidebar from "../Components/Nav/NavMobileSidebar";
import NavTopBar from "../Components/Nav/NavTopBar";
import { useAuth } from "../Components/Auth/AuthContext";
import type { AppView } from "../Components/Nav/nav.types";
import { useAppNavigation } from "../Components/Nav/useAppNavigation";
import UserProfile from "../Components/UserProfile/UserProfile";
import UserEdit from "../Components/Users/UserEdit";
import UserList from "../Components/Users/UserList";

/*
  Example.tsx

  This is the main screen a user sees after logging in.
  Think of it as the app shell: it brings together the shared navigation on the left
  and the content area on the right.
*/

export default function Example() {
  // These pieces of state only control the Team/User editing experience.
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userEditorMode, setUserEditorMode] = useState<"edit" | "create">(
    "edit",
  );

  // The shared navigation hook manages which screen is active,
  // whether the mobile sidebar is open, and the logout flow.
  const {
    sidebarOpen,
    setSidebarOpen,
    currentView,
    selectView,
    isLoggingOut,
    handleLogout,
  } = useAppNavigation({
    defaultView: "Dashboard",
    onViewChange: (view: AppView) => {
      // When the user changes sections from the sidebar,
      // we reset the Team editor back to its normal list state.
      setIsEditingUser(false);

      if (view !== "Team") {
        setSelectedUserId(null);
        setUserEditorMode("edit");
      }
    },
  });

  const { canAccessAdminControls, currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  // If the current person loses access to Admin Controls, move them back to
  // a safe default screen instead of leaving them on a restricted view.
  useEffect(() => {
    if (currentView === "Admin Controls" && !canAccessAdminControls) {
      selectView("Dashboard");
    }
  }, [canAccessAdminControls, currentView, selectView]);

  function handleStartUserEdit(userId: number) {
    if (!isAdmin) return;

    setSelectedUserId(userId);
    setUserEditorMode("edit");
    selectView("Team");
    setIsEditingUser(true);
  }

  function handleStartUserCreate() {
    if (!isAdmin) return;

    setSelectedUserId(null);
    setUserEditorMode("create");
    selectView("Team");
    setIsEditingUser(true);
  }

  function handleCancelUserEdit() {
    setIsEditingUser(false);
    setSelectedUserId(null);
    setUserEditorMode("edit");
  }

  function handleUserSaveComplete() {
    setIsEditingUser(false);
    setSelectedUserId(null);
    setUserEditorMode("edit");
  }

  // This function decides which content panel should appear on the page.
  // This pattern is called conditional rendering in React.
  function renderMainContent() {
    switch (currentView) {
      case "Dashboard":
        return <Dashboard />;

      case "Team":
        return isAdmin && isEditingUser ? (
          <UserEdit
            mode={userEditorMode}
            userId={selectedUserId}
            onCancel={handleCancelUserEdit}
            onSaveComplete={handleUserSaveComplete}
          />
        ) : (
          <UserList
            onEditUser={isAdmin ? handleStartUserEdit : undefined}
            onAddUser={isAdmin ? handleStartUserCreate : undefined}
          />
        );

      case "Profile":
        return <UserProfile />;

      case "Calendar":
        return <Calendar />;

      case "Admin Controls":
        return canAccessAdminControls ? (
          <AdminControls />
        ) : (
          <p className="ui-danger-text text-sm">
            You do not have access to Admin Controls.
          </p>
        );

      case "Documents":
        return <div>Documents content</div>;

      case "Reports":
        return <div>Reports content</div>;

      default:
        return null;
    }
  }

  return (
    <div className="ui-text-primary">
      {/* Mobile version of the left navigation. */}
      <NavMobileSidebar
        open={sidebarOpen}
        onClose={setSidebarOpen}
        currentView={currentView}
        onSelectView={selectView}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Desktop version of the same navigation. */}
      <NavDesktopSidebar
        currentView={currentView}
        onSelectView={selectView}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Compact top bar only shown on smaller screens. */}
      <NavTopBar
        currentView={currentView}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenProfile={() => selectView("Profile")}
      />

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">{renderMainContent()}</div>
      </main>
    </div>
  );
}
