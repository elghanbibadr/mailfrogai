"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { completeOnboarding } from "@/lib/actions/account";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export function OnboardingDialog({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });

  const finish = (values: ProfileInput | null) =>
    startTransition(async () => {
      const res = await completeOnboarding(values);
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      router.refresh();
      if (values) toast.success("Profile saved");
    });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : finish(null))}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => finish(values))} noValidate>
          <DialogHeader>
            <DialogTitle>Welcome to MailForge AI</DialogTitle>
            <DialogDescription>
              Tell us about your business once. We&apos;ll pre-fill it every time you generate an email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Your name" htmlFor="ob-name" error={errors.full_name?.message}>
              <Input id="ob-name" autoComplete="name" aria-invalid={!!errors.full_name} {...register("full_name")} />
            </Field>
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
              hint="One or two sentences. This becomes the default for the generator."
              error={errors.company_description?.message}
            >
              <Textarea id="ob-desc" {...register("company_description")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => finish(null)} disabled={pending}>
              Skip for now
            </Button>
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
