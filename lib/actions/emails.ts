"use server";

import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { emailEditSchema, emailStatusSchema, uuidSchema } from "@/lib/validations/email";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";
import type { EmailGeneration } from "@/types";

/** Saves edits to a generated email and moves it from draft to saved. */
export async function saveEmail(id: string, input: unknown): Promise<ActionResult<EmailGeneration>> {
  if (!uuidSchema.safeParse(id).success) return fail("Email not found.", "INVALID");
  const parsed = emailEditSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const { supabase } = ctx;

  const { data, error } = await supabase
    .from("email_generations")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return fromDbError(error);

  let row = data as EmailGeneration;
  if (row.status === "draft") {
    const { data: promoted } = await supabase
      .from("email_generations")
      .update({ status: "saved" })
      .eq("id", id)
      .select()
      .single();
    if (promoted) row = promoted as EmailGeneration;
  }

  revalidatePath("/dashboard", "layout");
  return ok(row);
}

export async function updateEmailStatus(
  id: string,
  status: unknown,
): Promise<ActionResult<EmailGeneration>> {
  if (!uuidSchema.safeParse(id).success) return fail("Email not found.", "INVALID");
  const parsed = emailStatusSchema.safeParse(status);
  if (!parsed.success) return fail("Choose a valid status.", "INVALID");

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("email_generations")
    .update({ status: parsed.data })
    .eq("id", id)
    .select()
    .single();
  if (error) return fromDbError(error);

  revalidatePath("/dashboard", "layout");
  return ok(data as EmailGeneration);
}

export async function deleteEmail(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return fail("Email not found.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("email_generations").delete().eq("id", id);
  if (error) return fromDbError(error);
  revalidatePath("/dashboard", "layout");
  return ok(null);
}
