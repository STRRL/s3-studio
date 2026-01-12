export type IconName =
  | "database"
  | "star"
  | "clock"
  | "settings"
  | "key-round";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface QuickAccessItem {
  label: string;
  href: string;
  color: string;
}

export interface User {
  name: string;
  email?: string;
  avatar?: string;
  sessionType: string;
}
