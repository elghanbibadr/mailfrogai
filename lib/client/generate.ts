import type { GeneratorInput } from "@/lib/validations/generator";
import type { EmailGeneration } from "@/types";

export type GenerationResponse =
  | { ok: true; email: EmailGeneration }
  | { ok: false; code?: string; error: string };

export async function requestGeneration(input: GeneratorInput): Promise<GenerationResponse> {
  try {
    const res = await fetch("/api/generate", {
        method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as GenerationResponse;
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}
