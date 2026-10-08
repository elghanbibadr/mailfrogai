import type { GeneratorInput } from "@/lib/validations/generator";
import type { EmailGeneration } from "@/types";

/** Rebuilds the generator form values from a stored email, for regenerate / reuse. */
export function emailToInput(email: EmailGeneration): GeneratorInput {
  return {
    firstName: email.prospect_first_name,
    lastName: email.prospect_last_name,
    jobTitle: email.prospect_title,
    company: email.prospect_company,
    website: email.prospect_website,
    yourName: email.sender_name,
    yourCompany: email.sender_company,
    offer: email.offer,
    targetCustomer: email.target_customer,
    goal: email.goal,
    valueProp: email.value_prop,
recipientEmail: email.recipient_email ?? "",
    tone: email.tone,
    cta: email.cta_preference,
    context: email.context,
    templateId: email.template_id ?? "",
    leadId: email.lead_id ?? "",
  };
}

export function emailToPlainText(email: Pick<EmailGeneration, "subject" | "opening" | "body" | "cta">) {
  return `Subject: ${email.subject}\n\n${email.opening}\n\n${email.body}\n\n${email.cta}`;
}

export function prospectName(email: EmailGeneration) {
  return [email.prospect_first_name, email.prospect_last_name].filter(Boolean).join(" ");
}
