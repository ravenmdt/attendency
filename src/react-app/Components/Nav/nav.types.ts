import type { ComponentType, SVGProps } from "react";

/*
  nav.types.ts

  This file stores the shared TypeScript types used by the navigation system.
  Keeping these types in one place makes the components easier to reuse and
  helps the editor catch mistakes while you code.
*/

// These are the main views a user can switch between from the left sidebar.
export type AppView =
  | "Dashboard"
  | "Team"
  | "Profile"
  | "Admin Controls"
  | "Calendar"
  | "Documents"
  | "Reports";

// Heroicons are React components, so we describe their shape once here.
export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavigationItem = {
  name: AppView;
  href: string;
  icon: NavIcon;
};

export type TeamLink = {
  id: number;
  name: string;
  href: string;
  initial: string;
  current: boolean;
};

export type SidebarProfile = {
  name: string;
  imageUrl: string;
};
