import {
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { NavigationItem } from "./nav.types";

/*
  nav.config.ts

  This file contains the static data for the sidebar:
  - the main navigation items
  - the profile/brand info shown in the layout

  Separating configuration from UI makes the sidebar easier to update later.
*/

export const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "#", icon: HomeIcon },
  { name: "Team", href: "#", icon: UsersIcon },
  { name: "Admin Controls", href: "#", icon: Cog6ToothIcon },
  { name: "Calendar", href: "#", icon: CalendarIcon },
  { name: "Reports", href: "#", icon: ChartPieIcon },
  { name: "Feedback", href: "#", icon: DocumentDuplicateIcon },
];


export const sidebarBrand = {
  name: "Attendency",
};
