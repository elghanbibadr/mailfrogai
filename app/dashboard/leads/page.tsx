import { LeadsManager } from "@/components/leads/leads-manager";
import { requireUser } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import type { Lead } from "@/types";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const { supabase, user } = await requireUser();
  const [{ data }, usage] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000),
    getUsage(supabase, user.id),
  ]);

  return <LeadsManager initialLeads={(data ?? []) as Lead[]} limit={usage.limits.leads} />;
}
