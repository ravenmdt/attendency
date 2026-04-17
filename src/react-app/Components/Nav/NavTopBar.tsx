import { Bars3Icon } from "@heroicons/react/24/outline";
import { sidebarProfile } from "./nav.config";
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
};

export default function NavTopBar({
  currentView,
  onOpenSidebar,
}: NavTopBarProps) {
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

      <a href="#">
        <span className="sr-only">Your profile</span>
        <img
          alt=""
          src={sidebarProfile.imageUrl}
          className="ui-profile-avatar size-8 rounded-full outline -outline-offset-1"
        />
      </a>
    </div>
  );
}
