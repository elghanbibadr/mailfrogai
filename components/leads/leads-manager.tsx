"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Search, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deleteLead } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

export function LeadsManager({
  initialLeads,
  limit,
}: {
  initialLeads: Lead[];
  limit: number | null;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!q) return true;
      return [l.name, l.company, l.job_title, l.email, l.website].some((v) => v.toLowerCase().includes(q));
    });
  }, [leads, query, status]);

  const openAdd = () => {
    if (limit !== null && leads.length >= limit) {
      return setUpgradeReason(`The Free plan includes ${limit} saved leads. Upgrade to Pro for unlimited leads.`);
    }
    setEditing(null);
    setDialogOpen(true);
  };

  const onSaved = (lead: Lead) =>
    setLeads((prev) =>
      prev.some((l) => l.id === lead.id) ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev],
    );

  const confirmDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteLead(toDelete.id);
      if (!res.ok) return void toast.error(res.error);
      setLeads((prev) => prev.filter((l) => l.id !== toDelete.id));
      setToDelete(null);
      toast.success("Lead deleted");
    });
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description="Prospects you want to write to. Generate an email for any of them in one click."
        actions={
          <Button onClick={openAdd}>
            <Plus /> Add lead
          </Button>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No leads yet"
          description="Your leads will appear here once you start adding prospects."
          action={
            <Button size="sm" onClick={openAdd}>
              <Plus /> Add your first lead
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                aria-label="Search leads"
                placeholder="Search by name, company, or email"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-44">
              <Select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "all" | LeadStatus)}
              >
                <option value="all">All statuses</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No matching leads"
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
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_100px_110px_auto] gap-4 border-b bg-card/60 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
                <span>Lead</span>
                <span>Company</span>
                <span>Status</span>
                <span>Added</span>
                <span className="w-[210px]" />
              </div>
              <ul className="divide-y">
                {filtered.map((lead) => (
                  <li
                    key={lead.id}
                    className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_100px_110px_auto] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lead.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[lead.job_title, lead.email].filter(Boolean).join(" · ") || "No details"}
                      </p>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{lead.company || "-"}</p>
                    <div>
                      <Badge className={cn(LEAD_STATUS_STYLES[lead.status])}>{lead.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                    <div className="flex items-center gap-1 md:w-[210px] md:justify-end">
                      <Link
                        href={`/dashboard/generate?lead=${lead.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <Sparkles /> Generate Email
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${lead.name}`}
                        onClick={() => {
                          setEditing(lead);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${lead.name}`}
                        className="hover:text-destructive"
                        onClick={() => setToDelete(lead)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {limit !== null && (
            <p className="mt-3 text-xs text-muted-foreground">
              {leads.length} of {limit} free leads used.
            </p>
          )}
        </>
      )}

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editing}
        onSaved={onSaved}
        onLimitReached={setUpgradeReason}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this lead?"
        description={`${toDelete?.name ?? "This lead"} will be removed. Emails you've already generated stay in your history.`}
        confirmLabel="Delete lead"
        destructive
        loading={pending}
        onConfirm={confirmDelete}
      />
      <UpgradeDialog
        open={upgradeReason !== null}
        onOpenChange={(open) => !open && setUpgradeReason(null)}
        reason={upgradeReason ?? ""}
      />
    </>
  );
}
