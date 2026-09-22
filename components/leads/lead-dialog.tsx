"use client";

import { useEffect, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveLead } from "@/lib/actions/leads";
import { LEAD_STATUSES } from "@/lib/constants";
import { emptyLead, leadSchema, type LeadInput } from "@/lib/validations/lead";
import type { Lead } from "@/types";

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
  onLimitReached,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSaved: (lead: Lead) => void;
  onLimitReached: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({ resolver: zodResolver(leadSchema), defaultValues: emptyLead });

  useEffect(() => {
    if (open) {
      reset(
        lead
          ? {
              name: lead.name,
              job_title: lead.job_title,
              company: lead.company,
              website: lead.website,
              email: lead.email,
              status: lead.status,
            }
          : emptyLead,
      );
    }
  }, [open, lead, reset]);

  const submit = (values: LeadInput) =>
    startTransition(async () => {
      const res = await saveLead(values, lead?.id);
      if (!res.ok) {
        if (res.code === "LIMIT_REACHED") {
          onOpenChange(false);
          return onLimitReached(res.error);
        }
        return void toast.error(res.error);
      }
      onSaved(res.data);
      onOpenChange(false);
      toast.success(lead ? "Lead updated" : "Lead added");
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
            <DialogDescription>Save a prospect so you can generate emails for them in one click.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="lead-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="lead-name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label="Job title" htmlFor="lead-title" error={errors.job_title?.message}>
              <Input id="lead-title" {...register("job_title")} />
            </Field>
            <Field label="Company" htmlFor="lead-company" error={errors.company?.message}>
              <Input id="lead-company" {...register("company")} />
            </Field>
            <Field label="Website" htmlFor="lead-site" error={errors.website?.message}>
              <Input id="lead-site" placeholder="acme.com" {...register("website")} />
            </Field>
            <Field label="Email" htmlFor="lead-email" error={errors.email?.message}>
              <Input id="lead-email" type="email" {...register("email")} />
            </Field>
            <Field label="Status" htmlFor="lead-status" className="sm:col-span-2">
              <Select id="lead-status" {...register("status")}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {lead ? "Save changes" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
