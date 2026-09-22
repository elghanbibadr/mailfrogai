"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
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
import { deleteAccount, signOut, updateProfile } from "@/lib/actions/account";
import {
  companySchema,
  nameSchema,
  type CompanyInput,
  type NameInput,
} from "@/lib/validations/profile";

export function ProfileForm({ defaults, email }: { defaults: NameInput; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<NameInput>({ resolver: zodResolver(nameSchema), defaultValues: defaults });

  const submit = (values: NameInput) =>
    startTransition(async () => {
      const res = await updateProfile(values);
      if (!res.ok) return void toast.error(res.error);
      reset(values);
      router.refresh();
      toast.success("Profile updated");
    });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="set-name" error={errors.full_name?.message}>
          <Input id="set-name" autoComplete="name" aria-invalid={!!errors.full_name} {...register("full_name")} />
        </Field>
        <Field label="Email" htmlFor="set-email" hint="This is your sign-in address.">
          <Input id="set-email" value={email} readOnly disabled />
        </Field>
      </div>
      <Button type="submit" size="sm" loading={pending} disabled={!isDirty}>
        Save profile
      </Button>
    </form>
  );
}

export function CompanyForm({ defaults }: { defaults: CompanyInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyInput>({ resolver: zodResolver(companySchema), defaultValues: defaults });

  const submit = (values: CompanyInput) =>
    startTransition(async () => {
      const res = await updateProfile(values);
      if (!res.ok) return void toast.error(res.error);
      reset(values);
      router.refresh();
      toast.success("Company details updated");
    });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" htmlFor="set-company" error={errors.company_name?.message}>
          <Input id="set-company" autoComplete="organization" {...register("company_name")} />
        </Field>
        <Field label="Website" htmlFor="set-site" error={errors.company_website?.message}>
          <Input id="set-site" placeholder="acme.com" {...register("company_website")} />
        </Field>
      </div>
      <Field
        label="Description"
        htmlFor="set-desc"
        hint="Used to pre-fill 'What you offer' in the generator."
        error={errors.company_description?.message}
      >
        <Textarea id="set-desc" {...register("company_description")} />
      </Field>
      <Button type="submit" size="sm" loading={pending} disabled={!isDirty}>
        Save company
      </Button>
    </form>
  );
}

export function AccountSection() {
  const [pendingOut, startOut] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, startDelete] = useTransition();

  const confirmDelete = () =>
    startDelete(async () => {
      const res = await deleteAccount(confirmation);
      // On success the server action redirects to "/", so we only get here on failure.
      if (res && !res.ok) toast.error(res.error);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Log out</p>
          <p className="text-sm text-muted-foreground">End your session on this device.</p>
        </div>
        <Button variant="outline" size="sm" loading={pendingOut} onClick={() => startOut(() => signOut())}>
          <LogOut /> Log out
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div>
          <p className="text-sm font-medium">Delete account</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Permanently removes your account, leads, templates and email history, and cancels any active subscription.
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmation("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Type DELETE to confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={confirmation !== "DELETE"} loading={deleting} onClick={confirmDelete}>
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
