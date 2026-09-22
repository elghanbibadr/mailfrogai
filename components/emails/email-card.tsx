"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Pencil, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { deleteEmail, saveEmail } from "@/lib/actions/emails";
import { EMAIL_STATUS_STYLES } from "@/lib/constants";
import { emailToPlainText } from "@/lib/emails";
import { cn, wordCount } from "@/lib/utils";
import type { EmailGeneration } from "@/types";

type Draft = Pick<EmailGeneration, "subject" | "opening" | "body" | "cta">;
const pick = (e: EmailGeneration): Draft => ({
  subject: e.subject,
  opening: e.opening,
  body: e.body,
  cta: e.cta,
});

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function EmailCard({
  email,
  busy = false,
  onRegenerate,
  onUpdated,
  onDeleted,
  className,
}: {
  email: EmailGeneration;
  busy?: boolean;
  onRegenerate: () => void;
  onUpdated: (email: EmailGeneration) => void;
  onDeleted: (id: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(pick(email));
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Reset local edits whenever a different email (or a fresh regeneration) is shown.
  useEffect(() => {
    setDraft(pick(email));
    setEditing(false);
  }, [email.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = editing ? draft : pick(email);
  const words = wordCount(`${shown.opening} ${shown.body} ${shown.cta}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(emailToPlainText(shown));
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveEmail(email.id, draft);
      if (!res.ok) return void toast.error(res.error);
      onUpdated(res.data);
      setEditing(false);
      toast.success("Email saved");
    });

  const remove = () =>
    startTransition(async () => {
      const res = await deleteEmail(email.id);
      if (!res.ok) return void toast.error(res.error);
      setConfirmDelete(false);
      onDeleted(email.id);
      toast.success("Email deleted");
    });

  return (
    <article className={cn("rounded-lg border bg-card", className)} aria-busy={busy}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-3" aria-hidden /> AI Generated
          </Badge>
          <Badge className={EMAIL_STATUS_STYLES[email.status]}>{email.status}</Badge>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{words} words</span>
      </header>

      <div className={cn("space-y-5 px-5 py-5 transition-opacity", busy && "opacity-50")}>
        <Block label="Subject">
          {editing ? (
            <Input
              aria-label="Subject"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            />
          ) : (
            <p className="font-medium">{shown.subject}</p>
          )}
        </Block>
        <Block label="Opening">
          {editing ? (
            <Textarea
              aria-label="Opening"
              className="min-h-[60px]"
              value={draft.opening}
              onChange={(e) => setDraft({ ...draft, opening: e.target.value })}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{shown.opening}</p>
          )}
        </Block>
        <Block label="Email body">
          {editing ? (
            <Textarea
              aria-label="Email body"
              className="min-h-[160px]"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{shown.body}</p>
          )}
        </Block>
        <Block label="Call to action">
          {editing ? (
            <Textarea
              aria-label="Call to action"
              className="min-h-[60px]"
              value={draft.cta}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{shown.cta}</p>
          )}
        </Block>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
        {editing ? (
          <>
            <Button size="sm" onClick={save} loading={pending}>
              <Save /> Save changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setDraft(pick(email));
                setEditing(false);
              }}
            >
              <X /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={busy}>
              <Pencil /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={onRegenerate} loading={busy}>
              {!busy && <RefreshCw />} Regenerate
            </Button>
            {email.status === "draft" && (
              <Button
                size="sm"
                onClick={save}
                loading={pending}
                disabled={busy}
              >
                <Save /> Save
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              <Trash2 /> Delete
            </Button>
          </>
        )}
      </footer>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this email?"
        description="This removes it from your history. It won't give back the generation you used."
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={remove}
      />
    </article>
  );
}
