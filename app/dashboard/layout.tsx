import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { requireUser } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | MailForge AI" } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();

  const [{ data }, usage] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUsage(supabase, user.id),
  ]);
  const profile = data as Profile | null;
  const name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || "";

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r bg-card/40 p-4 lg:flex">
        <Logo href="/dashboard" className="px-1" />
        <SidebarNav isPro={usage.isPro} />
      </aside>

      <div className="lg:pl-60">
        <Topbar name={name} email={user.email ?? ""} usage={usage} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
