"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { EmailCard } from "@/components/emails/email-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateEmailStatus } from "@/lib/actions/emails";
import { requestGeneration } from "@/lib/client/generate";
import { EMAIL_STATUSES, EMAIL_STATUS_STYLES } from "@/lib/constants";
import { emailToInput, prospectName } from "@/lib/emails";
import { cn, formatDate } from "@/lib/utils";
import type { EmailGeneration, EmailStatus } from "@/types";

export function HistoryList({
  initialEmails,
  initialQuery,
  initialOpenId,
}: {
  initialEmails: EmailGeneration[];
  initialQuery: string;
  initialOpenId: string | null;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<"all" | EmailStatus>("all");
  const [openId, setOpenId] = useState<string | null>(
    initialOpenId && initialEmails.some((e) => e.id === initialOpenId) ? initialOpenId : null,
  );
  const [regenerating, setRegenerating] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  const selected = emails.find((e) => e.id === openId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      return [prospectName(e), e.prospect_company, e.subject, e.body].some((v) => v.toLowerCase().includes(q));
    });
  }, [emails, query, status]);

  const replace = (email: EmailGeneration) =>
    setEmails((prev) => prev.map((e) => (e.id === email.id ? email : e)));

  const regenerate = async () => {
    if (!selected) return;
    setRegenerating(true);
    const res = await requestGeneration(emailToInput(selected));
    setRegenerating(false);

    if (res.ok) {
      setEmails((prev) => [res.email, ...prev]);
      setOpenId(res.email.id);
      toast.success("New version generated");
    } else if (res.code === "LIMIT_REACHED") {
      setOpenId(null);
      setUpgradeReason(res.error);
    } else {
      toast.error(res.error);
    }
  };

  const changeStatus = async (next: EmailStatus) => {
    if (!selected) return;
    const res = await updateEmailStatus(selected.id, next);
    if (res.ok) replace(res.data);
    else toast.error(res.error);
  };

  return (
    <>
      <PageHeader title="History" description="Every email you've generated. Open one to copy, edit, or regenerate it." />

      {emails.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No emails yet"
          description="Generate your first personalized email to see it here."
          action={
            <Link href="/dashboard/generate" className={buttonVariants({ size: "sm" })}>
              Generate email
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                aria-label="Search history"
                placeholder="Search by prospect, company, or subject"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-44">
              <Select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "all" | EmailStatus)}
              >
                <option value="all">All statuses</option>
                {EMAIL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No matching emails"
              description="Try a different search or clear the status filter."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_110px_90px] gap-4 border-b bg-card/60 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
                <span>Prospect</span>
                <span>Subject</span>
                <span>Created</span>
                <span>Status</span>
              </div>
              <ul className="divide-y">
                {filtered.map((email) => (
                  <li key={email.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(email.id)}
                      className="grid w-full gap-1 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_110px_90px] md:items-center md:gap-4"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{prospectName(email)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{email.prospect_company}</span>
                      </span>
                      <span className="truncate text-sm">{email.subject}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(email.created_at)}</span>
                      <span>
                        <Badge className={cn(EMAIL_STATUS_STYLES[email.status])}>{email.status}</Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-2xl p-0">
          {selected && (
            <>
              <DialogHeader className="mb-0 gap-1 border-b p-5 pr-12">
                <DialogTitle>{prospectName(selected)}</DialogTitle>
                <DialogDescription>
                  {[selected.prospect_title, selected.prospect_company].filter(Boolean).join(" at ")} ·{" "}
                  {formatDate(selected.created_at)}
                </DialogDescription>
                <div className="mt-2 max-w-[10rem]">
                  <Select
                    aria-label="Email status"
                    value={selected.status}
                    onChange={(e) => changeStatus(e.target.value as EmailStatus)}
                    className="h-8 text-xs"
                  >
                    {EMAIL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>
              </DialogHeader>
              <EmailCard
                email={selected}
                busy={regenerating}
                onRegenerate={regenerate}
                onUpdated={replace}
                onDeleted={(id) => {
                  setEmails((prev) => prev.filter((e) => e.id !== id));
                  setOpenId(null);
                }}
                className="rounded-none border-0"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={upgradeReason !== null}
        onOpenChange={(open) => !open && setUpgradeReason(null)}
        reason={upgradeReason ?? ""}
      />
    </>
  );
}
