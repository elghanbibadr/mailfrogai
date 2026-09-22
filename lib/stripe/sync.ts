import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/types";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      // incomplete, paused: no paid access yet
      return "free";
  }
}

/** current_period_end moved from the subscription to its items in newer Stripe API versions. */
function periodEnd(sub: Stripe.Subscription): string | null {
  const seconds =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number } | undefined)
      ?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * Writes a Stripe subscription into Supabase. This is the ONLY place subscription
 * status is set, and it is only reached from the signature-verified webhook.
 */
export async function syncSubscription(sub: Stripe.Subscription, userIdHint?: string | null) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let userId = sub.metadata?.user_id || userIdHint || null;
  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) throw new Error(`No user found for Stripe customer ${customerId}`);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status: mapStatus(sub.status),
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      price_id: sub.items.data[0]?.price.id ?? null,
      current_period_end: periodEnd(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
