import { google } from "googleapis";
import { getOAuthClient } from "./oauth";

// Strip CR/LF so user-controlled values can't inject extra email headers.
const clean = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** Builds the base64url-encoded RFC 2822 message that Gmail's API expects. */
export function buildRaw(p: { from: string; to: string; subject: string; body: string }) {
  const lines = [
    `From: ${clean(p.from)}`,
    `To: ${clean(p.to)}`,
    // Encoded-word syntax keeps accents and emoji in the subject intact.
    `Subject: =?UTF-8?B?${Buffer.from(clean(p.subject)).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  const raw = lines.join("\r\n") + "\r\n\r\n" + Buffer.from(p.body).toString("base64");
  return Buffer.from(raw).toString("base64url");
}

/** Sends a prepared message from the user's own Gmail account. */
export async function sendViaGmail(refreshToken: string, raw: string) {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: client });
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return { messageId: res.data.id!, threadId: res.data.threadId! };
}