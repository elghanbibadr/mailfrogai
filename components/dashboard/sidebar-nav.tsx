"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, History, LayoutDashboard, Settings, Sparkles, Users, Zap } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/billing-buttons";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/generate", label: "Generate Email", icon: Sparkles },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/history", label: "History", icon: History },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Settings;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4", active && "text-primary")} aria-hidden />
      {label}
    </Link>
  );
}

export function SidebarNav({ isPro, onNavigate }: { isPro: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col justify-between">
      <div className="space-y-0.5">
        {MAIN.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="space-y-0.5 border-t pt-3">
        <NavLink href="/dashboard/settings" label="Settings" icon={Settings} onNavigate={onNavigate} />
        {!isPro && (
          <UpgradeButton
            variant="ghost"
            className="w-full justify-start gap-2.5 px-2.5 py-2 font-normal text-primary hover:text-primary"
          >
            <Zap aria-hidden />
            Upgrade
          </UpgradeButton>
        )}
      </div>
    </nav>
  );
}
