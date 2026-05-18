import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";
import {
  IconEvents,
  IconGallery,
  IconOverview,
  IconPhotos,
  IconProfile,
  IconSettings,
  IconUsers,
} from "@/components/dashboard/nav-icons";

export const portalNavItems: DashboardNavItem[] = [
  {
    href: "/portal",
    label: "Overview",
    icon: <IconOverview />,
    matchPrefix: false,
  },
  {
    href: "/portal/gallery",
    label: "My gallery",
    icon: <IconGallery />,
    matchPrefix: false,
  },
  {
    href: "/portal/profile",
    label: "Profile",
    icon: <IconProfile />,
    matchPrefix: false,
  },
];

export const adminNavBaseItems: DashboardNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <IconOverview />,
    matchPrefix: false,
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: <IconEvents />,
    matchPrefix: true,
  },
];

export const adminUsersNavItem: DashboardNavItem = {
  href: "/admin/users",
  label: "Users",
  icon: <IconUsers />,
  matchPrefix: false,
};

export function adminNavItems(includeUsers: boolean): DashboardNavItem[] {
  return includeUsers
    ? [...adminNavBaseItems, adminUsersNavItem]
    : adminNavBaseItems;
}

export function eventSubNavItems(eventId: string): DashboardNavItem[] {
  const base = `/admin/events/${eventId}`;
  return [
    {
      href: base,
      label: "Overview",
      icon: <IconOverview />,
      matchPrefix: false,
    },
    {
      href: `${base}/photos`,
      label: "Photos",
      icon: <IconPhotos />,
      matchPrefix: false,
    },
    {
      href: `${base}/organizers`,
      label: "Organizers",
      icon: <IconUsers />,
      matchPrefix: false,
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      icon: <IconSettings />,
      matchPrefix: false,
    },
  ];
}
