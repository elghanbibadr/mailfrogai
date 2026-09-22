"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { profileSchema } from "@/lib/validations/profile";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";

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
  if (error) return fromDbError(error);

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
  if (error) return fromDbError(error);

  revalidatePath("/dashboard", "layout");
  return ok(null);
}

/** Permanently deletes the account. Cascading foreign keys remove all of the user's data. */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  if (confirmation !== "DELETE") return fail("Type DELETE to confirm.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  try {
    const admin = createAdminClient();

    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (sub?.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
      } catch (error) {
        // Already canceled or missing on Stripe's side; don't block deletion.
        console.error("Stripe cancel during account deletion failed:", error);
      }
    }

    const { error } = await admin.auth.admin.deleteUser(ctx.user.id);
    if (error) throw error;
  } catch (error) {
    console.error("Account deletion failed:", error);
    return fail("We couldn't delete your account. Try again or contact support.");
  }

  await ctx.supabase.auth.signOut().catch(() => undefined);
  redirect("/");
}
