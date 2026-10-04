"use server";

import { revalidatePath } from "next/cache";
import { getAuthed } from "@/lib/auth";
import { templateSchema } from "@/lib/validations/template";
import { uuidSchema } from "@/lib/validations/email";
import { fail, fromDbError, invalid, ok, unauthorized, type ActionResult } from "./types";
import type { Template } from "@/types";

// The DB column is `value_proposition` (snake_case, standard Postgres
// convention) but the form/Zod schema uses `valueProposition` (camelCase,
// standard TS convention). `offer`, `name`, `description`, `instructions`
// are single words so the casing never mattered for them — this mapping
// is the only place that needs to bridge the two conventions.
function toDbRow(input: ReturnType<typeof templateSchema.parse>) {
  const { valueProposition, ...rest } = input;
  return { ...rest, value_proposition: valueProposition };
}

function fromDbRow(row: Record<string, unknown>): Template {
  const { value_proposition, ...rest } = row;
  return { ...rest, value_proposition: value_proposition } as Template;
}

export async function saveTemplate(input: unknown, id?: string): Promise<ActionResult<Template>> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (id && !uuidSchema.safeParse(id).success) return fail("Template not found.", "INVALID");

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const { supabase, user } = ctx;

  const payload = toDbRow(parsed.data);

  const { data, error } = id
    ? await supabase.from("templates").update(payload).eq("id", id).select().single()
    : await supabase
        .from("templates")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

  if (error) {
    // No row matched on update (deleted in another tab, or hidden by RLS): expected, not a bug.
    if (id && error.code === "PGRST116") return fail("Template not found.", "INVALID");

    return fromDbError(error, {
      action: id ? "updateTemplate" : "createTemplate",
      extra: { userId: user.id, templateId: id },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(fromDbRow(data));
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return fail("Template not found.", "INVALID");
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase.from("templates").delete().eq("id", id);

  if (error) {
    return fromDbError(error, {
      action: "deleteTemplate",
      extra: { userId: ctx.user.id, templateId: id },
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(null);
}