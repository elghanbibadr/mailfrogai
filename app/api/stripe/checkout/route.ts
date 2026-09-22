import { NextResponse } from "next/server";
import { getAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getSubscription, isProStatus } from "@/lib/usage";
import { getAppUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getAuthed();
  if (!ctx) return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  const { supabase, user } = ctx;

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 500 });

  const subscription = await getSubscription(supabase, user.id);
  if (isProStatus(subscription)) {
    return NextResponse.json(
      { error: "You're already on Pro. Use Manage subscription to change your plan." },
      { status: 409 },
    );
  }

  try {
    const stripe = getStripe();
    const admin = createAdminClient();

    let customerId = subscription?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("subscriptions")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    const appUrl = getAppUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session failed:", error);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 500 });
  }
}
