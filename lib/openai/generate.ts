import { getOpenAI } from "@/lib/openai/client";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/openai/prompt";
import {
  generatedEmailSchema,
  type GeneratedEmail,
  type GeneratorInput,
} from "@/lib/validations/generator";
import OpenAI from "openai";

function parseModelJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Calls OpenAI and validates the response with Zod.
 * Retries once if the model returns something that isn't valid JSON in the expected shape.
 */
export async function generateEmail(params: {
  input: GeneratorInput;
  templateInstructions?: string;
  model: string;
}): Promise<GeneratedEmail> {
const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await openai.chat.completions.create({
    model: "z-ai/glm-5.3-flash",
    messages: [{"role":"system","content":"You are a helpful assistant."},{"role":"user","content":"Which number is larger, 9.11 or 9.8?"}],
    temperature: 0.5,
    top_p: 1,
    max_tokens: 1024,
    stream: false,
  })
   
  // process.stdout.write(completion.choices[0]?.message?.content);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      lastError = new Error("The model returned an empty response.");
      continue;
    }

    try {
      const parsed = generatedEmailSchema.safeParse(parseModelJson(content));
      if (parsed.success) return parsed.data;
      lastError = parsed.error;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `The model response could not be validated: ${lastError instanceof Error ? lastError.message : "unknown error"}`,
  );
}
