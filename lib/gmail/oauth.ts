// lib/gmail/oauth.ts
import { google } from "googleapis";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`,
  );
}