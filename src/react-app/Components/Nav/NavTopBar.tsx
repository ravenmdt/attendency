import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "../Auth/AuthContext";
import type { AppView } from "./nav.types";

/*
  NavTopBar.tsx

  On small screens, the full left sidebar is hidden.
  This compact top bar gives the user two key actions:
  - open the sidebar
  - see which section they are currently viewing
*/

type NavTopBarProps = {
  currentView: AppView;
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
};

export default function NavTopBar({
  currentView,
  onOpenSidebar,
  onOpenProfile,
}: NavTopBarProps) {
  const { currentUser } = useAuth();
  const profileName = currentUser?.name ?? "Signed-in user";
  const profileImageUrl =
    currentUser?.imageUrl ??
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <div className="ui-surface sticky top-0 z-40 flex items-center gap-x-6 px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon aria-hidden="true" className="size-6" />
      </button>

      <div className="ui-text-primary flex-1 text-sm/6 font-semibold">
        {currentView}
      </div>

      <button type="button" onClick={onOpenProfile}>
        <span className="sr-only">Current user profile</span>
        <img
          alt={profileName}
          src={profileImageUrl}
          className="ui-profile-avatar size-8 rounded-full outline -outline-offset-1"
        />
      </button>
    </div>
  );
}
