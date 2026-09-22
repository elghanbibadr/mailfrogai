import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { UpgradeButton } from "@/components/dashboard/billing-buttons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMAIL_STATUS_STYLES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prospectName } from "@/lib/emails";
import { getUsage } from "@/lib/usage";
import { cn, formatDate } from "@/lib/utils";
import type { EmailGeneration } from "@/types";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [usage, recent] = await Promise.all([
    getUsage(supabase, user.id),
    supabase
      .from("email_generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const emails = (recent.data ?? []) as EmailGeneration[];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your outreach at a glance."
        actions={
          <Link href="/dashboard/generate" className={buttonVariants()}>
            <Sparkles /> Generate email
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Emails generated" value={usage.generationsTotal} note="All time" />
        <Stat label="Emails this month" value={usage.generationsThisMonth} />
        <Stat label="Saved leads" value={usage.leadCount} />
        <Stat
          label="Current plan"
          value={usage.isPro ? "Pro" : "Free"}
          note={usage.subscription?.status === "past_due" ? "Payment past due" : undefined}
        />
      </div>

      {!usage.isPro && (
        <Card className="mt-4">
          <CardContent className="grid gap-6 p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <UsageMeter label="AI generations" used={usage.generationsThisMonth} limit={usage.limits.generations} />
            <UsageMeter label="Saved leads" used={usage.leadCount} limit={usage.limits.leads} />
            <UsageMeter label="Custom templates" used={usage.templateCount} limit={usage.limits.templates} />
            <UpgradeButton variant="default" size="sm" />
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent generations</CardTitle>
          {emails.length > 0 && (
            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title="No emails yet"
              description="Generate your first personalized email to see it here."
              action={
                <Link href="/dashboard/generate" className={buttonVariants({ size: "sm" })}>
                  Generate email
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {emails.map((email) => (
                <li key={email.id}>
                  <Link
                    href={`/dashboard/history?open=${email.id}`}
                    className="flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{email.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {prospectName(email)} · {email.prospect_company}
                      </p>
                    </div>
                    <Badge className={cn("hidden sm:inline-flex", EMAIL_STATUS_STYLES[email.status])}>
                      {email.status}
                    </Badge>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatDate(email.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
