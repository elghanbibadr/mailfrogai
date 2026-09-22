import { NextResponse } from "next/server";
import { getAuthed } from "@/lib/auth";
import { getStripe } from "@/lib/stripe/server";
import { getSubscription } from "@/lib/usage";
import { getAppUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getAuthed();
  if (!ctx) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });

  const subscription = await getSubscription(ctx.supabase, ctx.user.id);
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "There's no billing account to manage yet." }, { status: 404 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppUrl(req)}/dashboard/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal session failed:", error);
    return NextResponse.json({ error: "Couldn't open the billing portal. Try again." }, { status: 500 });
  }
}
