import type { AppView } from "./nav.types";
import NavSidebarContent from "./NavSidebarContent";

/*
  NavDesktopSidebar.tsx

  This is the always-visible sidebar shown on large screens.
  It uses the shared sidebar content component so the layout stays consistent
  between desktop and mobile views.
*/

type NavDesktopSidebarProps = {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onLogout: () => void | Promise<void>;
  isLoggingOut: boolean;
};

export default function NavDesktopSidebar({
  currentView,
  onSelectView,
  onLogout,
  isLoggingOut,
}: NavDesktopSidebarProps) {
  return (
    <div className="ui-page-bg hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="ui-surface ui-border flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 dark:bg-black/10">
        <NavSidebarContent
          currentView={currentView}
          onSelectView={onSelectView}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
          showProfileFooter
        />
      </div>
    </div>
  );
}
