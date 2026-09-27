"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { completeOnboarding } from "@/lib/actions/account";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { cn } from "@/lib/utils";

const STEPS = ["You", "Your business"] as const;

export function OnboardingFlow({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });

  const finish = (values: ProfileInput | null) =>
    startTransition(async () => {
      const res = await completeOnboarding(values);
      if (!res.ok) return void toast.error(res.error);
      router.push("/dashboard");
      router.refresh();
    });

  const next = async () => {
    const valid = await trigger("full_name");
    if (valid) setStep(1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={cn("h-1.5 w-8 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-secondary")}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => finish(null)}
          disabled={pending}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip for now
        </button>
      </div>

      <form onSubmit={handleSubmit((values) => finish(values))} noValidate className="space-y-5">
        {step === 0 ? (
          <>
            <div>
              <h1 className="text-xl font-semibold">Welcome to MailForge AI</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">First, what should we call you?</p>
            </div>
            <Field label="Your name" htmlFor="ob-name" error={errors.full_name?.message}>
              <Input
                id="ob-name"
                autoFocus
                autoComplete="name"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
            </Field>
            <Button type="button" className="w-full" onClick={next}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold">Tell us about your business</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                This pre-fills the generator so you don't retype it every time.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" htmlFor="ob-company" error={errors.company_name?.message}>
                <Input id="ob-company" autoComplete="organization" {...register("company_name")} />
              </Field>
              <Field label="Website" htmlFor="ob-site" error={errors.company_website?.message}>
                <Input id="ob-site" placeholder="acme.com" {...register("company_website")} />
              </Field>
            </div>
            <Field
              label="What do you offer?"
              htmlFor="ob-desc"
              hint="One or two sentences is enough."
              error={errors.company_description?.message}
            >
              <Textarea id="ob-desc" autoFocus {...register("company_description")} />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)} disabled={pending}>
                Back
              </Button>
              <Button type="submit" className="flex-1" loading={pending}>
                Finish setup
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
