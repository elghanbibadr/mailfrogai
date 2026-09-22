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

  if (error) return fromDbError(error);
  revalidatePath("/dashboard", "layout");
  return ok(data as Lead);
}

export async function deleteLead(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return fail("Lead not found.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("leads").delete().eq("id", id);
  if (error) return fromDbError(error);
  revalidatePath("/dashboard", "layout");
  return ok(null);
}
