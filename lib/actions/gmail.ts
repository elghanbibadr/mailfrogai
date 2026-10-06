"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthed } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { revokeGoogleToken } from "@/lib/gmail/revoke";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/lib/validations/email";
import { fail, fromDbError, ok, unauthorized, type ActionResult } from "./types";
import type { EmailGeneration } from "@/types";
import { reportError } from "../validations/monitoring";
import { buildRaw, sendViaGmail } from "../gmail/send";

const DAILY_SEND_LIMIT = 50; // protects the user's Gmail account from suspension
const recipientSchema = z.string().trim().email().max(254);
const SEND_FAILED = "Couldn't send the email. Try again.";

export async function sendEmail(id: string, to: unknown): Promise<ActionResult<EmailGeneration>> {
  if (!uuidSchema.safeParse(id).success) return fail("Email not found.", "INVALID");
  const recipient = recipientSchema.safeParse(to);
  if (!recipient.success) return fail("Enter a valid recipient email.", "INVALID");

  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const { supabase, user } = ctx;
  const admin = createAdminClient();

  // 1. Gmail connection (tokens are only readable with the admin client)
  const { data: conn, error: connError } = await admin
    .from("gmail_connections")
    .select("email, refresh_token_enc")
    .eq("user_id", user.id)
    .maybeSingle();
  if (connError) {
    return fromDbError(connError, {
      action: "sendEmail.loadConnection",
      extra: { userId: user.id },
      message: SEND_FAILED,
    });
  }
  if (!conn) return fail("Connect your Gmail account in Settings to send emails.", "GMAIL_NOT_CONNECTED");

  // 2. The email (RLS-scoped read proves ownership)
  const { data: email, error: emailError } = await supabase
    .from("email_generations")
    .select("*")
    .eq("id", id)
    .single();
  if (emailError) {
    if (emailError.code === "PGRST116") return fail("Email not found.", "INVALID");
    return fromDbError(emailError, {
      action: "sendEmail.loadEmail",
      extra: { userId: user.id, emailId: id },
      message: SEND_FAILED,
    });
  }
  if (email.status === "sent" || email.status === "sending") {
    return fail("This email was already sent.", "INVALID");
  }

  // 3. Daily cap
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("email_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("sent_at", since);
  if (countError) {
    return fromDbError(countError, {
      action: "sendEmail.countSent",
      extra: { userId: user.id },
      message: SEND_FAILED,
    });
  }
  if ((count ?? 0) >= DAILY_SEND_LIMIT) {
    return fail(`You've reached the daily limit of ${DAILY_SEND_LIMIT} emails. Try again tomorrow.`, "SEND_LIMIT");
  }

  // 4. Atomically claim the email so a double click can't send it twice.
  const previousStatus = email.status;
  const { data: claimed, error: claimError } = await supabase
    .from("email_generations")
    .update({ status: "sending" })
    .eq("id", id)
    .eq("status", previousStatus)
    .select("id")
    .maybeSingle();
  if (claimError) {
    return fromDbError(claimError, {
      action: "sendEmail.claim",
      extra: { userId: user.id, emailId: id },
      message: SEND_FAILED,
    });
  }
  if (!claimed) return fail("This email is already being sent.", "INVALID");

  const revert = async () => {
    const { error } = await supabase
      .from("email_generations")
      .update({ status: previousStatus })
      .eq("id", id);
    if (error) {
      reportError(error, {
        tags: { source: "sendEmail", step: "revert_status" },
        extra: { userId: user.id, emailId: id },
      });
    }
  };

  // 5. Send
  let sent: { messageId: string; threadId: string };
  try {
    sent = await sendViaGmail(
      decrypt(conn.refresh_token_enc),
      buildRaw({
        from: conn.email,
        to: recipient.data,
        subject: email.subject,
        body: [email.opening, email.body, email.cta].filter(Boolean).join("\n\n"),
      }),
    );
  } catch (err) {
    await revert();
    const message = String((err as Error)?.message ?? err);

    // Revoked/expired token or missing permission: expected, not a bug. Ask to reconnect.
    if (message.includes("invalid_grant") || /insufficient/i.test(message)) {
      const { error: delError } = await admin.from("gmail_connections").delete().eq("user_id", user.id);
      if (delError) {
        reportError(delError, {
          tags: { source: "sendEmail", step: "drop_connection" },
          extra: { userId: user.id },
        });
      }
      revalidatePath("/dashboard", "layout");
      return fail("Your Gmail connection expired. Reconnect it in Settings.", "GMAIL_DISCONNECTED");
    }

    // Gmail throttling: also expected.
    const status = Number((err as { code?: unknown; status?: unknown })?.code ?? (err as { status?: unknown })?.status);
    if (status === 429 || /rate limit|quota/i.test(message)) {
      return fail("Gmail is limiting sending right now. Try again later.", "RATE_LIMITED");
    }

    reportError(err, {
      tags: { source: "sendEmail", step: "gmail_send" },
      extra: { userId: user.id, emailId: id },
    });
    return fail(SEND_FAILED);
  }

  // 6. Mark as sent
  const sentAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("email_generations")
    .update({
      status: "sent",
      sent_at: sentAt,
      recipient_email: recipient.data,
      gmail_message_id: sent.messageId,
      gmail_thread_id: sent.threadId,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    // The email WAS delivered. Report it, but don't show a failure (the user would resend).
    reportError(updateError, {
      tags: { source: "sendEmail", step: "mark_sent" },
      extra: { userId: user.id, emailId: id, gmailMessageId: sent.messageId },
    });
    return ok({
      ...email,
      status: "sent",
      sent_at: sentAt,
      recipient_email: recipient.data,
      gmail_message_id: sent.messageId,
      gmail_thread_id: sent.threadId,
    } as EmailGeneration);
  }

  revalidatePath("/dashboard", "layout");
  return ok(updated as EmailGeneration);
}

export async function disconnectGmail(): Promise<ActionResult> {
  const ctx = await getAuthed();
  if (!ctx) return unauthorized();
  const admin = createAdminClient();

  const { data: conn, error: readError } = await admin
    .from("gmail_connections")
    .select("refresh_token_enc")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (readError) {
    return fromDbError(readError, {
      action: "disconnectGmail.read",
      extra: { userId: ctx.user.id },
      message: "Couldn't disconnect Gmail. Try again.",
    });
  }

  if (conn) {
    try {
      await revokeGoogleToken(decrypt(conn.refresh_token_enc));
    } catch {
      // Undecryptable token: still allow disconnecting.
    }
  }

  const { error } = await admin.from("gmail_connections").delete().eq("user_id", ctx.user.id);
  if (error) {
    return fromDbError(error, {
      action: "disconnectGmail",
      extra: { userId: ctx.user.id },
      message: "Couldn't disconnect Gmail. Try again.",
    });
  }

  revalidatePath("/dashboard", "layout");
  return ok(null);
}