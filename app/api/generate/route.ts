import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmail } from "@/lib/openai/generate";
import type { TemplateContext } from "@/lib/openai/prompt";
import { generatorSchema } from "@/lib/validations/generator";
import { getSubscription, isProStatus } from "@/lib/usage";
import { FREE_LIMITS } from "@/lib/constants";
import type { EmailGeneration } from "@/types";
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_MAX_PER_MINUTE = 6;

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json({ ok: false, ...body }, { status });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ code: "UNAUTHORIZED", error: "Sign in to generate emails." }, 401);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ code: "INVALID", error: "Invalid request." }, 400);
  }

  const parsed = generatorSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ code: "INVALID", error: parsed.error.issues[0]?.message ?? "Invalid input." }, 400);
  }
  const input = parsed.data;

  // Templates and leads are read with the user's own client, so RLS proves ownership.
  let template: TemplateContext | undefined;
  if (input.templateId) {
    const { data } = await supabase
      .from("templates")
      .select("instructions, offer, value_proposition")
      .eq("id", input.templateId)
      .maybeSingle();
    if (!data) return json({ code: "INVALID", error: "That template no longer exists." }, 400);

    // DB columns are snake_case (value_proposition); TemplateContext uses
    // camelCase (valueProposition) to match the rest of the app's convention.
    template = {
      instructions: data.instructions as string,
      offer: (data.offer as string | null) ?? undefined,
      valueProposition: (data.value_proposition as string | null) ?? undefined,
    };
  }
  if (input.leadId) {
    const { data } = await supabase.from("leads").select("id").eq("id", input.leadId).maybeSingle();
    if (!data) return json({ code: "INVALID", error: "That lead no longer exists." }, 400);
  }

  // The plan comes from the database (written by the Stripe webhook), never from the client.
  const isPro = isProStatus(await getSubscription(supabase, user.id));

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.error("Supabase service role key is missing.");
    return json({ code: "FAILED", error: "The server isn't configured correctly." }, 500);
  }

  const { data: quota, error: quotaError } = await admin.rpc("consume_generation", {
    p_user_id: user.id,
    p_limit: isPro ? null : FREE_LIMITS.generations,
    p_rate_max: RATE_MAX_PER_MINUTE,
  });
  if (quotaError) {
    console.error("consume_generation failed:", quotaError);
    return json({ code: "FAILED", error: "Couldn't check your usage. Try again." }, 500);
  }
  if (quota === "limit") {
    return json(
      { code: "LIMIT_REACHED", error: `You've used all ${FREE_LIMITS.generations} free generations this month.` },
      402,
    );
  }
  if (quota === "rate") {
    return json({ code: "RATE_LIMITED", error: "You're generating too quickly. Wait a moment and try again." }, 429);
  }

  const release = () => admin.rpc("release_generation", { p_user_id: user.id });
  const model = process.env.OPENAI_PRO_MODEL ?? "gpt-4o";
  //  isPro
  // ? (process.env.OPENAI_PRO_MODEL ?? "gpt-4o")
  // : (process.env.OPENAI_MODEL ?? "gpt-4o-mini");

  let generated;
  try {
    generated = await generateEmail({ input, template, model });
  } catch (error) {
    console.error("Email generation failed:", error);
        Sentry.captureException(error, { tags: { route: "generate", step: "generateEmail" }, extra: { userId: user.id, model } });

    await release();
    return json(
      { code: "AI_FAILED", error: "The AI couldn't generate an email right now. Your usage wasn't counted. Try again." },
      502,
    );
  }

  const { data: row, error: insertError } = await supabase
    .from("email_generations")
    .insert({
      user_id: user.id,
      lead_id: input.leadId || null,
      template_id: input.templateId || null,
      prospect_first_name: input.firstName,
      prospect_last_name: input.lastName,
      prospect_title: input.jobTitle,
      prospect_company: input.company,
      prospect_website: input.website,
      sender_name: input.yourName,
      sender_company: input.yourCompany,
      offer: input.offer,
      target_customer: input.targetCustomer,
      goal: input.goal,
      value_prop: input.valueProp,
      tone: input.tone,
      cta_preference: input.cta,
      context: input.context,
      subject: generated.subject,
      opening: generated.opening,
      body: generated.body,
      cta: generated.cta,
      status: "draft",
      model,
    })
    .select()
    .single();

  if (insertError || !row) {
    console.error("Saving generation failed:", insertError);

    await release();
    return json({ code: "FAILED", error: "The email was generated but couldn't be saved. Try again." }, 500);
  }

  return NextResponse.json({ ok: true, email: row as EmailGeneration });
}