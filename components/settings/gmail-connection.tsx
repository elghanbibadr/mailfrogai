"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disconnectGmail } from "@/lib/actions/gmail";

const RESULTS: Record<string, { type: "success" | "error"; text: string }> = {
  connected: { type: "success", text: "Gmail connected." },
  denied: { type: "error", text: "Connection cancelled." },
  missing_permission: { type: "error", text: "Please allow the send-email permission to connect Gmail." },
  invalid: { type: "error", text: "Something went wrong. Try connecting again." },
  failed: { type: "error", text: "Couldn't connect Gmail. Try again." },
};

export function GmailConnection({ email, result }: { email: string | null; result?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shown = useRef(false);

  // Show the callback result once, then clean the URL so a refresh doesn't repeat it.
  useEffect(() => {
    if (!result || shown.current) return;
    shown.current = true;
    const r = RESULTS[result];
    if (r) toast[r.type](r.text);
    router.replace("/dashboard/settings");
  }, [result, router]);

  const disconnect = () =>
    startTransition(async () => {
      try {
        const res = await disconnectGmail();
        if (!res.ok) return void toast.error(res.error);
        toast.success("Gmail disconnected.");
        router.refresh();
      } catch {
        toast.error("Couldn't disconnect. Try again.");
      }
    });

  if (!email) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm text-muted-foreground">
          Connect your Gmail account to send emails straight from MailForge AI. We only request permission to send,
          never to read your inbox.
        </p>
        {/* Plain <a>: this is a full redirect to Google, not a client-side navigation. */}
        <Button asChild>
          <a href="/api/gmail/connect">
            <Mail className="size-4" aria-hidden /> Connect Gmail
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <dl className="text-sm">
        <dt className="text-muted-foreground">Sending as</dt>
        <dd className="mt-1 flex items-center gap-2 font-medium">
          {email}
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Connected</Badge>
        </dd>
      </dl>
      <Button variant="outline" onClick={disconnect} disabled={isPending}>
        {isPending ? "Disconnecting..." : "Disconnect"}
      </Button>
    </div>
  );
}