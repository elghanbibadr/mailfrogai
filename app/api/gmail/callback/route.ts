// app/api/gmail/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOAuthClient } from "@/lib/gmail/oauth";
import { encrypt } from "@/lib/crypto";
import { reportError } from "@/lib/validations/monitoring";

export async function GET(req: NextRequest) {
  const back = (q: string) =>
    NextResponse.redirect(new URL(`/dashboard/settings?${q}`, process.env.NEXT_PUBLIC_APP_URL));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = (await cookies()).get("gmail_oauth_state")?.value;

  if (req.nextUrl.searchParams.get("error")) return back("gmail=denied"); // user clicked Cancel
  if (!code || !state || state !== saved) return back("gmail=invalid");

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    // Google lets users untick individual permissions, so verify the scope was granted.
    if (!tokens.scope?.includes("gmail.send") || !tokens.refresh_token || !tokens.id_token) {
      return back("gmail=missing_permission");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const email = ticket.getPayload()?.email;
    if (!email) return back("gmail=invalid");

    const { error } = await createAdminClient().from("gmail_connections").upsert({
      user_id: user.id,
      email,
      refresh_token_enc: encrypt(tokens.refresh_token),
    });
    if (error) throw error;

    return back("gmail=connected");
  } catch (error) {
    reportError(error, { tags: { route: "gmail_callback" }, extra: { userId: user.id } });
    return back("gmail=failed");
  }
}