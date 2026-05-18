import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { PLATFORM_NAME } from "@/lib/brand";
import { portalNavItems } from "@/lib/dashboard-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      brand={<span className="brand-gradient-text">{PLATFORM_NAME}</span>}
      brandHref="/portal"
      navItems={portalNavItems}
      actions={<SignOutButton />}
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
