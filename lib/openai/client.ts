import OpenAI from "openai";

let client: OpenAI | null = null;

/** Server-only. Reads from the environment; never hardcode keys here. */
export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  client ??= new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined, // e.g. https://integrate.api.nvidia.com/v1
    timeout: 25_000,
    maxRetries: 1,
  });
  return client;
}