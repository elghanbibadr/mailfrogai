"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { EmailCard } from "@/components/emails/email-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GOALS, TONES } from "@/lib/constants";
import { requestGeneration } from "@/lib/client/generate";
import { generatorSchema, type GeneratorInput } from "@/lib/validations/generator";
import type { EmailGeneration, Template } from "@/types";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
      <legend className="float-left mb-4 w-full">
        <span className="block text-base font-semibold">{title}</span>
        {description && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{description}</span>}
      </legend>
      <div className="clear-both grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function GeneratorForm({
  defaults,
  templates,
  gmailEmail,
}: {
  defaults: GeneratorInput;
  templates: Template[];

}) {
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState<EmailGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneratorInput>({ resolver: zodResolver(generatorSchema), defaultValues: defaults });

  const starters = templates.filter((t) => t.user_id === null);
  const custom = templates.filter((t) => t.user_id !== null);

  const generate = async (values: GeneratorInput) => {
    setLoading(true);
    console.log("valuyes",values)

    const res = await requestGeneration(values);
    setLoading(false);

    if (res.ok) {
      setEmail(res.email);
      router.refresh(); // updates the usage indicator in the top bar
      requestAnimationFrame(() => {
        if (window.matchMedia("(max-width: 1023px)").matches) {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } else if (res.code === "LIMIT_REACHED") {
      setUpgradeReason(res.error);
    } else {
      toast.error(res.error);
    }
  };

  const onInvalid = () => toast.error("Fix the highlighted fields to continue.");

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-12">
      <form onSubmit={handleSubmit(generate, onInvalid)} noValidate className="space-y-6">
        <Section title="Prospect">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" {...register("lastName")} />
          </Field>
          <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle?.message}>
            <Input id="jobTitle" placeholder="Head of Growth" {...register("jobTitle")} />
          </Field>
          <Field label="Company" htmlFor="company" error={errors.company?.message}>
            <Input id="company" aria-invalid={!!errors.company} {...register("company")} />
          </Field>
          <Field label="Company website" htmlFor="website" error={errors.website?.message} className="sm:col-span-2">
            <Input id="website" placeholder="northwind.com" {...register("website")} />
          </Field>
          <Field
  label="Business email"
  htmlFor="recipientEmail"
  className="sm:col-span-2"
  hint="Optional. Lets you send the email straight from here once it's generated."
  error={errors.recipientEmail?.message}
>
  <Input
    id="recipientEmail"
    type="email"
    inputMode="email"
    autoComplete="off"
    placeholder="john@northwind.com"
    aria-invalid={!!errors.recipientEmail}
    {...register("recipientEmail")}
  />
</Field>
          <Field
            label="Additional context"
            htmlFor="context"
            className="sm:col-span-2"
            hint="Paste anything real you know: a recent post, a hiring page, a note from a call. The email only uses what you give it."
            error={errors.context?.message}
          >
            <Textarea id="context" {...register("context")} />
          </Field>
        </Section>

        <Section title="Your business">
          <Field label="Your name" htmlFor="yourName" error={errors.yourName?.message}>
            <Input id="yourName" autoComplete="name" aria-invalid={!!errors.yourName} {...register("yourName")} />
          </Field>
          <Field label="Company name" htmlFor="yourCompany" error={errors.yourCompany?.message}>
            <Input id="yourCompany" autoComplete="organization" {...register("yourCompany")} />
          </Field>
          <Field label="What you offer" htmlFor="offer" className="sm:col-span-2" error={errors.offer?.message}>
            <Textarea id="offer" aria-invalid={!!errors.offer} {...register("offer")} />
          </Field>
          <Field label="Target customer" htmlFor="targetCustomer" className="sm:col-span-2" error={errors.targetCustomer?.message}>
            <Input id="targetCustomer" placeholder="B2B SaaS teams with 10 to 50 people" {...register("targetCustomer")} />
          </Field>
        </Section>

        <Section title="Outreach">
          <Field label="Goal" htmlFor="goal" error={errors.goal?.message}>
            <Select id="goal" {...register("goal")}>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tone" htmlFor="tone" error={errors.tone?.message}>
            <Select id="tone" {...register("tone")}>
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Key value proposition" htmlFor="valueProp" className="sm:col-span-2" error={errors.valueProp?.message}>
            <Textarea id="valueProp" className="min-h-[72px]" aria-invalid={!!errors.valueProp} {...register("valueProp")} />
          </Field>
          <Field label="Call to action" htmlFor="cta" error={errors.cta?.message} hint="Optional. Leave empty to let the AI pick one.">
            <Input id="cta" placeholder="A 15-minute call next week" {...register("cta")} />
          </Field>
          <Field label="Template" htmlFor="templateId" hint="Optional. Adds your template's instructions.">
            <Select id="templateId" {...register("templateId")}>
              <option value="">No template</option>
              {starters.length > 0 && (
                <optgroup label="Starter templates">
                  {starters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {custom.length > 0 && (
                <optgroup label="Your templates">
                  {custom.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>
        </Section>

        <input type="hidden" {...register("leadId")} />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {!loading && <Sparkles />} {loading ? "Generating..." : "Generate Email"}
        </Button>
      </form>

      <div ref={resultRef} className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
        {loading ? (
          <div className="space-y-4 rounded-lg border bg-card p-5" aria-busy="true" aria-live="polite">
            <p className="text-sm text-muted-foreground">Writing your email...</p>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : email ? (
          <EmailCard
            email={email}
              gmailEmail={gmailEmail}

            onRegenerate={handleSubmit(generate, onInvalid)}
            onUpdated={setEmail}
            onDeleted={() => {
              setEmail(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Mail className="size-5" aria-hidden />
            </div>
            <p className="font-medium">Your email will appear here</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Fill in the prospect and your offer, then generate. You can edit before saving.
            </p>
          </div>
        )}
      </div>

      <UpgradeDialog
        open={upgradeReason !== null}
        onOpenChange={(open) => !open && setUpgradeReason(null)}
        reason={upgradeReason ?? ""}
      />
    </div>
  );
}
