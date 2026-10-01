import { GeneratorForm } from "@/components/generator/generator-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth";
import { emailToInput } from "@/lib/emails";
import { splitName } from "@/lib/utils";
import { uuidSchema } from "@/lib/validations/email";
import { emptyGenerator, type GeneratorInput } from "@/lib/validations/generator";
import type { EmailGeneration, Lead, Profile, Template } from "@/types";

export const metadata = { title: "Generate email" };

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; template?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: templates }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("templates").select("*").order("created_at", { ascending: true }),
  ]);
  const p = profile as Profile | null;
  const templateList = (templates ?? []) as Template[];

  let defaults: GeneratorInput = {
    ...emptyGenerator,
    yourName: p?.full_name ?? "",
    yourCompany: p?.company_name ?? "",
    offer: "",
  };

  // Reuse the inputs of a previous email.
  if (sp.from && uuidSchema.safeParse(sp.from).success) {
    const { data } = await supabase.from("email_generations").select("*").eq("id", sp.from).maybeSingle();
    if (data) defaults = { ...defaults, ...emailToInput(data as EmailGeneration), leadId: "" };
  }

  // Pre-fill from a saved lead. RLS guarantees it belongs to the user.
  if (sp.lead && uuidSchema.safeParse(sp.lead).success) {
    const { data } = await supabase.from("leads").select("*").eq("id", sp.lead).maybeSingle();
    const lead = data as Lead | null;
    if (lead) {
      const { first, last } = splitName(lead.name);
      defaults = {
        ...defaults,
        firstName: first,
        lastName: last,
        jobTitle: lead.job_title,
        company: lead.company,
        website: lead.website,
        leadId: lead.id,
      };
    }
  }

  if (sp.template && templateList.some((t) => t.id === sp.template)) {
    defaults = { ...defaults, templateId: sp.template };
  }

  return (
    <>
      <PageHeader
        title="Generate email"
        description="Describe the prospect and your offer. MailForge writes a subject, opening, body and one call to action."
      />
      <GeneratorForm defaults={defaults} templates={templateList} />
    </>
  );
}