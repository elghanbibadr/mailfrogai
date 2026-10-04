"use server";

import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { leadSchema } from "@/lib/validations/lead";
import { uuidSchema } from "@/lib/validations/email";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";
import type { Lead } from "@/types";

export async function saveLead(input: unknown, id?: string): Promise<ActionResult<Lead>> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (id && !uuidSchema.safeParse(id).success) return fail("Lead not found.", "INVALID");

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const { supabase, user } = ctx;

  // RLS scopes both branches to the signed-in user; user_id is set server-side, never by the client.
  const { data, error } = id
    ? await supabase.from("leads").update(parsed.data).eq("id", id).select().single()
    : await supabase
        .from("leads")
        .insert({ ...parsed.data, user_id: user.id })
        .select()
        .single();

  if (error) {
    // .single() returns PGRST116 when no row matched (deleted, or RLS hid it).
    // That's an expected outcome, not a bug, so keep it out of Sentry.
    if (id && error.code === "PGRST116") return fail("Lead not found.", "INVALID");

    return fromDbError(error, {
      action: id ? "updateLead" : "createLead",
      extra: { userId: user.id, leadId: id },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(data as Lead);
}

export async function deleteLead(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return fail("Lead not found.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("leads").delete().eq("id", id);
  if (error) {
    return fromDbError(error, {
      action: "deleteLead",
      extra: { userId: ctx.user.id, leadId: id },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(null);
}