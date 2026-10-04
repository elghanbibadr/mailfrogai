"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { profileSchema } from "@/lib/validations/profile";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";
import { reportError } from "../validations/monitoring";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Updates any subset of the profile fields for the signed-in user. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.partial().safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("profiles").update(parsed.data).eq("id", ctx.user.id);
  if (error) {
    return fromDbError(error, {
      action: "updateProfile",
      extra: { userId: ctx.user.id },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(null);
}

/** Finishes onboarding. Pass `null` to skip without saving anything. */
export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  let values: Record<string, string> = {};
  if (input !== null) {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    values = parsed.data;
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ ...values, onboarded: true })
    .eq("id", ctx.user.id);
  if (error) {
    return fromDbError(error, {
      action: "completeOnboarding",
      extra: { userId: ctx.user.id, skipped: input === null },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(null);
}

/** Permanently deletes the account. Cascading foreign keys remove all of the user's data. */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  if (confirmation !== "DELETE") return fail("Type DELETE to confirm.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const userId = ctx.user.id;

  try {
    const admin = createAdminClient();

    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    // If this lookup fails we can't tell whether the user has a subscription.
    // Deleting anyway could leave an orphaned Stripe subscription that keeps billing.
    if (subError) throw subError;

    if (sub?.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
      } catch (error) {
        // Already canceled or missing on Stripe's side is expected: don't block deletion.
        const code = (error as { code?: string }).code;
        if (code !== "resource_missing") {
          console.error("Stripe cancel during account deletion failed:", error);
          reportError(error, {
            tags: { source: "deleteAccount", step: "stripe_cancel" },
            extra: { userId, stripeSubscriptionId: sub.stripe_subscription_id },
          });
        }
      }
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    console.error("Account deletion failed:", error);
    reportError(error, {
      tags: { source: "deleteAccount", step: "delete_user" },
      extra: { userId },
    });
    return fail("We couldn't delete your account. Try again or contact support.");
  }

  await ctx.supabase.auth.signOut().catch(() => undefined);
  redirect("/");
}