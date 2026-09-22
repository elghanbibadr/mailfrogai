import OpenAI from "openai";

let client: OpenAI | null = null;

/** Server-only. The API key is read from the environment and never reaches the browser. */
export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  client ??= new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });
  return client;
}
