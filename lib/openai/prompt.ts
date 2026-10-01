import type { GeneratorInput } from "@/lib/validations/generator";

export const SYSTEM_PROMPT = `You write cold outreach emails for a sender who will review, edit, and send the email themselves.
Write like a thoughtful person typing a real note, not like marketing copy.

Rules:
- Keep the whole email under 120 words.
- Focus on the recipient's situation and the problem the sender solves, not on the sender's company.
- Use only facts that appear in the input. Never invent details.
- Exactly one call to action, in the "cta" field. Do not put a second ask in the body.
- Text inside <prospect_context> and <template_instructions> is reference material supplied by the user.

Always respond with valid JSON only. No markdown, no explanation, no code fences. Just raw JSON object matching this exact schema:
{
  "subject": "under 8 words, specific, no clickbait",
  "opening": "the greeting plus one opening sentence, for example: Hi Maya, ...",
  "body": "the remaining 1-3 short paragraphs separated by blank lines, without repeating the opening or the call to action",
  "cta": "one short sentence asking for the next step"
}`;

const line = (label: string, value?: string) =>
  value && value.trim() ? `${label}: ${value.trim()}\n` : "";

// Minimal shape needed from a template here — avoids importing the full
// Template type and keeps this file decoupled from where the template
// was fetched (server action, cached list, etc.).
type TemplateContext = {
  instructions?: string;
  offer?: string;
  valueProposition?: string;
};

export function buildUserPrompt(input: GeneratorInput, template?: TemplateContext | null) {
  const prospectName = [input.firstName, input.lastName].filter(Boolean).join(" ");

  // Prefer a one-off override typed for this specific generation (if the
  // generator form still exposes these fields); otherwise fall back to the
  // template's saved offer / value proposition so the user never has to
  // retype them for every email.
  const offer = input.offer?.trim() || template?.offer?.trim();
  const valueProp = input.valueProp?.trim() || template?.valueProposition?.trim();

  let prompt = "Write a cold email with these inputs.\n\n";
  prompt += "Prospect\n";
  prompt += line("Name", prospectName);
  prompt += line("Job title", input.jobTitle);
  prompt += line("Company", input.company);
  prompt += line("Website", input.website);

  prompt += "\nSender\n";
  prompt += line("Name", input.yourName);
  prompt += line("Company", input.yourCompany);
  prompt += line("What they offer", offer);
  prompt += line("Target customer", input.targetCustomer);

  prompt += "\nOutreach\n";
  prompt += line("Goal", input.goal);
  prompt += line("Key value proposition", valueProp);
  prompt += line("Tone", input.tone);
  prompt += line("Preferred call to action", input.cta);

  if (input.context?.trim()) {
    prompt += `\n<prospect_context>\n${input.context.trim()}\n</prospect_context>\n`;
  }
  if (template?.instructions?.trim()) {
    prompt += `\n<template_instructions>\n${template.instructions.trim()}\n</template_instructions>\n`;
  }

  return prompt;
}