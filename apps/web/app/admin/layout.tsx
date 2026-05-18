import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PLATFORM_NAME } from "@/lib/brand";
import { adminNavItems } from "@/lib/dashboard-nav";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/roles";
import { AdminSignOutButton } from "./admin-sign-out";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const showUsers = isSuperadmin(session?.user?.role);

  return (
    <DashboardShell
      brand={<span className="brand-gradient-text">{PLATFORM_NAME}</span>}
      brandHref="/admin"
      navItems={adminNavItems(showUsers)}
      actions={<AdminSignOutButton />}
      sidebarFooter={
        <Link href="/" className="hover:text-primary">
          ← Back to site
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
