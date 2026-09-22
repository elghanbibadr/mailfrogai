import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES Row Level Security.
 * Only use it in server code for: Stripe webhooks, usage metering and account deletion.
 * Never import this from a client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
