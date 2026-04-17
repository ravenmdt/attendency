import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../Auth/AuthContext";
import { navigationItems, sidebarBrand } from "./nav.config";
import type { AppView } from "./nav.types";
import { classNames } from "./nav.utils";

/*
  NavSidebarContent.tsx

  This component renders the actual content inside the sidebar.
  Both the mobile sidebar and the desktop sidebar reuse this same layout,
  which avoids duplication and keeps the project easier to maintain.
*/

type NavSidebarContentProps = {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onLogout: () => void | Promise<void>;
  isLoggingOut: boolean;
  showProfileFooter?: boolean;
};

export default function NavSidebarContent({
  currentView,
  onSelectView,
  onLogout,
  isLoggingOut,
  showProfileFooter = false,
}: NavSidebarContentProps) {
  const { canAccessAdminControls, currentUser } = useAuth();

  const profileName = currentUser?.name ?? "Signed-in user";
  const profileImageUrl = currentUser?.imageUrl ?? null;

  // The server tells the UI whether the current signed-in person may see
  // the Admin Controls entry. Hiding it here keeps the navigation honest.
  const visibleNavigationItems = navigationItems.filter(
    (item) => item.name !== "Admin Controls" || canAccessAdminControls,
  );

  return (
    <>
      {/* Brand area shown at the top of the sidebar. */}
      <div className="flex h-16 shrink-0 items-center">
        <span className="ui-text-primary text-lg font-semibold tracking-tight">
          {sidebarBrand.name}
        </span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                {/* Main app destinations such as Dashboard, Team, and Calendar. */}
                <ul role="list" className="-mx-2 space-y-1">
                  {visibleNavigationItems.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => onSelectView(item.name)}
                        className={classNames(
                          currentView === item.name
                            ? "ui-nav-item-active"
                            : "ui-nav-item-idle",
                          "group flex w-full gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold",
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            currentView === item.name
                              ? "ui-nav-icon-active"
                              : "ui-nav-icon-idle",
                            "size-6 shrink-0",
                          )}
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </li>

          <li>
            {/* Logout stays inside the nav so it is easy to find on every screen. */}
            <button
              type="button"
              onClick={() => {
                void onLogout();
              }}
              disabled={isLoggingOut}
              className="ui-logout-button group -mx-2 flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold disabled:opacity-50"
            >
              <ArrowRightOnRectangleIcon
                aria-hidden="true"
                className="ui-logout-icon size-6 shrink-0"
              />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </li>

          {showProfileFooter ? (
            <li className="-mx-6 mt-auto">
              {/* Simple profile preview pinned to the bottom of the desktop sidebar. */}
              <button
                type="button"
                onClick={() => onSelectView("Profile")}
                className={classNames(
                  currentView === "Profile"
                    ? "ui-nav-item-active"
                    : "ui-profile-link",
                  "flex w-full items-center gap-x-4 px-6 py-3 text-left text-sm/6 font-semibold",
                )}
              >
                {profileImageUrl ? (
                  <img
                    alt={profileName}
                    src={profileImageUrl}
                    className="ui-profile-avatar size-8 rounded-full object-cover outline -outline-offset-1"
                  />
                ) : (
                  <UserCircleIcon
                    aria-hidden="true"
                    className="size-8 text-gray-300 dark:text-gray-500"
                  />
                )}
                <span className="sr-only">Current user profile</span>
                <span aria-hidden="true">{profileName}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  );
}
