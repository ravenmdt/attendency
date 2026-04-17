import {
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { NavigationItem, TeamLink } from "./nav.types";

/*
  nav.config.ts

  This file contains the static data for the sidebar:
  - the main navigation items
  - the sample team links
  - the profile info shown in the layout

  Separating configuration from UI makes the sidebar easier to update later.
*/

export const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "#", icon: HomeIcon },
  { name: "Team", href: "#", icon: UsersIcon },
  { name: "Admin Controls", href: "#", icon: Cog6ToothIcon },
  { name: "Calendar", href: "#", icon: CalendarIcon },
  { name: "Documents", href: "#", icon: DocumentDuplicateIcon },
  { name: "Reports", href: "#", icon: ChartPieIcon },
];

export const teamLinks: TeamLink[] = [
  { id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
  { id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
  { id: 3, name: "Workcation", href: "#", initial: "W", current: false },
];


export const sidebarBrand = {
  name: "Attendency",
  logoLight:
    "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600",
  logoDark:
    "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500",
};
