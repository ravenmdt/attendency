"use client";
//import { HashRouter as Router, Routes, Route } from "react-router-dom";
// https://www.youtube.com/watch?v=qi32YwjoN2U
import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import Calendar from "../Components/Calendar/Calendar.tsx";
import UserList from "../Components/Users/UserList";
import { useAuth } from "../Components/Auth/AuthContext";

const navigation = [
  { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
  { name: "Team", href: "#", icon: UsersIcon, current: false },
  { name: "Projects", href: "#", icon: FolderIcon, current: false },
  { name: "Calendar", href: "#", icon: CalendarIcon, current: false },
  { name: "Documents", href: "#", icon: DocumentDuplicateIcon, current: false },
  { name: "Reports", href: "#", icon: ChartPieIcon, current: false },
];
const teams = [
  { id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
  { id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
  { id: 3, name: "Workcation", href: "#", initial: "W", current: false },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("Dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Shared logout handler used by both desktop and mobile buttons.
  // This keeps the behavior consistent regardless of screen size.
  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
    setIsLoggingOut(false);
  }

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white dark:bg-gray-900">
        <body class="h-full">
        ```
      */}
      <div className="ui-text-primary">
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>

              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="ui-surface relative flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-2 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                <div className="relative flex h-16 shrink-0 items-center">
                  <img
                    alt="Your Company"
                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                    className="h-8 w-auto dark:hidden"
                  />
                  <img
                    alt="Your Company"
                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                    className="h-8 w-auto not-dark:hidden"
                  />
                </div>
                <nav className="relative flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentView(item.name);
                                setSidebarOpen(false);
                              }}
                              className={classNames(
                                currentView === item.name
                                  ? "ui-nav-item-active"
                                  : "ui-nav-item-idle",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left",
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
                    <li>
                      <div className="ui-teams-label text-xs/6 font-semibold">
                        Your teams
                      </div>
                      <ul role="list" className="-mx-2 mt-2 space-y-1">
                        {teams.map((team) => (
                          <li key={team.name}>
                            <a
                              href={team.href}
                              className={classNames(
                                team.current
                                  ? "ui-nav-item-active"
                                  : "ui-nav-item-idle",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                              )}
                            >
                              <span
                                className={classNames(
                                  team.current
                                    ? "ui-team-badge-active"
                                    : "ui-team-badge-idle",
                                  "ui-team-badge flex size-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium",
                                )}
                              >
                                {team.initial}
                              </span>
                              <span className="truncate">{team.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="mt-auto">
                      {/*
                        Mobile sidebar logout:
                        Keep session action inside the same navigation surface as other actions
                        so users can always find it in one predictable place.
                      */}
                      <button
                        type="button"
                        onClick={handleLogout}
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
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="ui-page-bg hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="ui-surface ui-border flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 dark:bg-black/10">
            <div className="flex h-16 shrink-0 items-center">
              <img
                alt="Your Company"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                className="h-8 w-auto dark:hidden"
              />
              <img
                alt="Your Company"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                className="h-8 w-auto not-dark:hidden"
              />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <button
                              type="button"
                              onClick={() => setCurrentView(item.name)}
                              className={classNames(
                                currentView === item.name
                                  ? "ui-nav-item-active"
                                  : "ui-nav-item-idle",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left",
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
                    <li>
                      <div className="ui-teams-label text-xs/6 font-semibold">
                        Your teams
                      </div>
                      <ul role="list" className="-mx-2 mt-2 space-y-1">
                        {teams.map((team) => (
                          <li key={team.name}>
                            <a
                              href={team.href}
                              className={classNames(
                                team.current
                                  ? "ui-nav-item-active"
                                  : "ui-nav-item-idle",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                              )}
                            >
                              <span
                                className={classNames(
                                  team.current
                                    ? "ui-team-badge-active"
                                    : "ui-team-badge-idle",
                                  "ui-team-badge flex size-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium",
                                )}
                              >
                                {team.initial}
                              </span>
                              <span className="truncate">{team.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  {/*
                    Desktop sidebar logout:
                    Session/account action is placed in the nav rail so it is reachable
                    from every content page without scanning the main content header.
                  */}
                  <button
                    type="button"
                    onClick={handleLogout}
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
                <li className="-mx-6 mt-auto">
                  <a
                    href="#"
                    className="ui-profile-link flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold"
                  >
                    <img
                      alt=""
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="ui-profile-avatar size-8 rounded-full outline -outline-offset-1"
                    />
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">Tom Cook</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="ui-surface sticky top-0 z-40 flex items-center gap-x-6 px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
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
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              className="ui-profile-avatar size-8 rounded-full outline -outline-offset-1"
            />
          </a>
        </div>

        <main className="py-10 lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8">
            {currentView === "Dashboard" && <div>Welcome to Dashboard</div>}
            {currentView === "Team" && <UserList />}
            {currentView === "Calendar" && <Calendar />}
            {currentView === "Projects" && <div>Projects content</div>}
            {currentView === "Documents" && <div>Documents content</div>}
            {currentView === "Reports" && <div>Reports content</div>}
          </div>
        </main>
      </div>
    </>
  );
}

/*The technique I used is called conditional rendering in React. It involves using component state (like currentView) to dynamically show or hide different UI elements or components based on user interactions, without navigating to new pages. This creates a single-page application (SPA) experience where content changes in place.

Key aspects:

State Management: A useState hook tracks the active view.
Event Handlers: Clicks update the state (e.g., setCurrentView('Calendar')).
JSX Conditionals: Logical && operators render components only when the condition matches (e.g., {currentView === 'Calendar' && <Calendar />}).
This is simpler than full routing libraries like React Router for basic tab-like navigation, but React Router could be used for more complex scenarios with URL changes. If you need URL-based routing instead, let me know!*/
