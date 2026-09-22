"use server";

import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { templateSchema } from "@/lib/validations/template";
import { uuidSchema } from "@/lib/validations/email";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";
import type { Template } from "@/types";

export async function saveTemplate(input: unknown, id?: string): Promise<ActionResult<Template>> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (id && !uuidSchema.safeParse(id).success) return fail("Template not found.", "INVALID");

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const { supabase, user } = ctx;

  const { data, error } = id
    ? await supabase.from("templates").update(parsed.data).eq("id", id).select().single()
    : await supabase
        .from("templates")
        .insert({ ...parsed.data, user_id: user.id })
        .select()
        .single();

  if (error) return fromDbError(error);
  revalidatePath("/dashboard", "layout");
  return ok(data as Template);
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return fail("Template not found.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("templates").delete().eq("id", id);
  if (error) return fromDbError(error);
  revalidatePath("/dashboard", "layout");
  return ok(null);
}
