import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_LIMITS } from "@/lib/constants";
import { currentPeriod } from "@/lib/utils";
import type { Subscription, UsageSnapshot } from "@/types";

export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

/** Only an "active" subscription grants Pro. The status is written exclusively by the Stripe webhook. */
export function isProStatus(subscription: Subscription | null) {
  return subscription?.status === "active";
}

export async function getUsage(supabase: SupabaseClient, userId: string): Promise<UsageSnapshot> {
  const period = currentPeriod();

  const [subscription, usageRows, leads, templates] = await Promise.all([
    getSubscription(supabase, userId),
    supabase.from("usage").select("period, generations").eq("user_id", userId),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("templates").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const rows = (usageRows.data ?? []) as { period: string; generations: number }[];
  const isPro = isProStatus(subscription);

  return {
    isPro,
    subscription,
    generationsThisMonth: rows.find((r) => r.period === period)?.generations ?? 0,
    generationsTotal: rows.reduce((sum, r) => sum + r.generations, 0),
    leadCount: leads.count ?? 0,
    templateCount: templates.count ?? 0,
    limits: isPro
      ? { generations: null, leads: null, templates: null }
      : { ...FREE_LIMITS },
  };
}
