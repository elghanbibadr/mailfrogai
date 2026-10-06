// lib/gmail/connection.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "../validations/monitoring";

export async function getGmailEmail(userId: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("gmail_connections")
    .select("email") // never select the token column here
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    reportError(error, { tags: { source: "getGmailEmail" }, extra: { userId } });
    return null;
  }
  return data?.email ?? null;
}