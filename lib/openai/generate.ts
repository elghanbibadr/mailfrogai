import { getOpenAI } from "@/lib/openai/client";
import { buildUserPrompt, SYSTEM_PROMPT, type TemplateContext } from "@/lib/openai/prompt";
import {
  generatedEmailSchema,
  type GeneratedEmail,
  type GeneratorInput,
} from "@/lib/validations/generator";

function parseModelJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function generateEmail(params: {
  input: GeneratorInput;
  // Was `templateInstructions?: string` — now takes the whole template so
  // buildUserPrompt can also pull offer / valueProposition automatically,
  // not just the instructions text.
  template?: TemplateContext | null;
  model: string;
}): Promise<GeneratedEmail> {
  const openai = getOpenAI();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: params.model, // "openai/gpt-oss-120b"
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(params.input, params.template) },
        ],
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        lastError = new Error("The model returned an empty response.");
        continue;
      }

      const parsed = generatedEmailSchema.safeParse(parseModelJson(content));
      if (parsed.success) {
        return parsed.data;
      }

      lastError = new Error(`Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `The model response could not be validated: ${lastError instanceof Error ? lastError.message : "unknown error"}`
  );
}