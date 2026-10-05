// app/api/gmail/connect/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getOAuthClient, GMAIL_SCOPES } from "@/lib/gmail/oauth";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const state = randomBytes(16).toString("hex");
  (await cookies()).set("gmail_oauth_state", state, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/",
  });

  const url = getOAuthClient().generateAuthUrl({
    access_type: "offline",   // needed to get a refresh token
    prompt: "consent",        // forces a refresh token even on reconnect
    scope: GMAIL_SCOPES,
    state,
  });
  return NextResponse.redirect(url);
}