import { CheckCircle2 } from "lucide-react";
import { ManageBillingButton, UpgradeButton } from "@/components/dashboard/billing-buttons";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccountSection, CompanyForm, ProfileForm } from "@/components/settings/settings-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export const metadata = { title: "Settings" };

const STATUS_LABEL = {
  free: "No active subscription",
  active: "Active",
  canceled: "Canceled",
  past_due: "Payment past due",
} as const;

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data }, usage] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUsage(supabase, user.id),
  ]);
  const profile = data as Profile | null;
  const sub = usage.subscription;
  const hasBillingAccount = Boolean(sub?.stripe_customer_id);

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, company details and subscription." />

      {sp.checkout === "success" && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Thanks for upgrading. Your plan updates as soon as Stripe confirms the payment, which usually takes a few
            seconds. Refresh this page if it still shows Free.
          </p>
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        <Section title="Profile" description="How you appear in MailForge AI.">
          <ProfileForm defaults={{ full_name: profile?.full_name ?? "" }} email={user.email ?? ""} />
        </Section>

        <Section title="Company" description="Your business details, used to pre-fill the generator.">
          <CompanyForm
            defaults={{
              company_name: profile?.company_name ?? "",
              company_website: profile?.company_website ?? "",
              company_description: profile?.company_description ?? "",
            }}
          />
        </Section>

        <Section title="Subscription" description="Your plan and billing status.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <dl className="grid gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Current plan</dt>
                <dd className="mt-1 font-medium">{usage.isPro ? "Pro" : "Free"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Billing status</dt>
                <dd className="mt-1">
                  <Badge
                    className={
                      sub?.status === "past_due"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : usage.isPro
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
                    }
                  >
                    {STATUS_LABEL[sub?.status ?? "free"]}
                  </Badge>
                </dd>
              </div>
              {sub?.current_period_end && usage.isPro && (
                <div>
                  <dt className="text-muted-foreground">
                    {sub.cancel_at_period_end ? "Ends on" : "Renews on"}
                  </dt>
                  <dd className="mt-1 font-medium">{formatDate(sub.current_period_end)}</dd>
                </div>
              )}
            </dl>
            {hasBillingAccount ? (
              <ManageBillingButton />
            ) : (
              <UpgradeButton />
            )}
          </div>
          {sub?.status === "past_due" && (
            <p className="mt-4 text-sm text-amber-300">
              Your last payment failed, so Pro features are paused. Update your payment method to restore them.
            </p>
          )}
          {sub?.status === "canceled" && hasBillingAccount && (
            <div className="mt-4">
              <UpgradeButton size="sm">Resubscribe to Pro</UpgradeButton>
            </div>
          )}
        </Section>

        <Section title="Account" description="Session and data controls.">
          <AccountSection />
        </Section>
      </div>
    </>
  );
}
