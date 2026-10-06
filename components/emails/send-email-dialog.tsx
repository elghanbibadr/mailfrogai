"use client";

import { useState, useTransition } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendEmail } from "@/lib/actions/gmail";
import type { EmailGeneration } from "@/types";

const emailSchema = z.string().email();

export function SendEmailDialog({
  email,
  gmailEmail,
  defaultTo = "",
  disabled,
  onSent,
}: {
  email: EmailGeneration;
  gmailEmail: string | null;
  defaultTo?: string;
  disabled?: boolean;
  onSent: (email: EmailGeneration) => void;
}) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(defaultTo);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [isPending, startTransition] = useTransition();

  const notConnected = !gmailEmail || needsConnect;
  const validTo = emailSchema.safeParse(to.trim()).success;

  const handleOpenChange = (next: boolean) => {
    if (isPending) return; // don't close mid-send
    if (next) setTo(defaultTo); // refresh the prefill every time it opens
    setOpen(next);
  };

  const send = () =>
    startTransition(async () => {
      try {
        const res = await sendEmail(email.id, to.trim());
        if (!res.ok) {
          if (res.code === "GMAIL_NOT_CONNECTED" || res.code === "GMAIL_DISCONNECTED") {
            setNeedsConnect(true);
          }
          toast.error(res.error);
          return;
        }
        toast.success(`Email sent to ${to.trim()}`);
        setOpen(false);
        onSent(res.data);
      } catch {
        toast.error("Couldn't send the email. Check your connection and try again.");
      }
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <Send /> Send
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send email</DialogTitle>
          <DialogDescription>
            {notConnected
              ? "Connect your Gmail account to send emails from MailForge AI."
              : "This sends the saved version of the email from your Gmail account."}
          </DialogDescription>
        </DialogHeader>

        {notConnected ? (
          <DialogFooter>
            <Button asChild>
              {/* Plain <a>: this is a full redirect to Google */}
              <a href="/api/gmail/connect">
                <Mail /> Connect Gmail
              </a>
            </Button>
          </DialogFooter>
        ) : (
          <>
            <div className="space-y-4 text-sm">
              <p>
                <span className="text-muted-foreground">From: </span>
                {gmailEmail}
              </p>

              <Field label="To (recipient's business email)" htmlFor="send-to">
                <Input
                  id="send-to"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="john@company.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={isPending}
                />
              </Field>

              <p>
                <span className="text-muted-foreground">Subject: </span>
                {email.subject}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={send} loading={isPending} disabled={!validTo}>
                {isPending ? "Sending..." : "Send email"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}