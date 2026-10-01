"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { deleteTemplate, saveTemplate } from "@/lib/actions/templates";
import { templateSchema, type TemplateInput } from "@/lib/validations/template";
import type { Template } from "@/types";

function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSaved,
  onLimitReached,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSaved: (t: Template) => void;
  onLimitReached: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", description: "", instructions: "", offer: "", valueProposition: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        template
          ? {
              name: template.name,
              description: template.description,
              instructions: template.instructions,
              offer: template.offer,
              valueProposition: template.valueProposition,
            }
          : { name: "", description: "", instructions: "", offer: "", valueProposition: "" },
      );
    }
  }, [open, template, reset]);

  const submit = (values: TemplateInput) =>
    
    startTransition(async () => {
      console.log("submited")
      const res = await saveTemplate(values, template?.id);
      if (!res.ok) {
        if (res.code === "LIMIT_REACHED") {
          onOpenChange(false);
          return onLimitReached(res.error);
        }
        return void toast.error(res.error);
      }
      onSaved(res.data);
      onOpenChange(false);
      toast.success(template ? "Template updated" : "Template created");
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Instructions are added to the AI prompt whenever you use this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Name" htmlFor="tpl-name" error={errors.name?.message}>
              <Input id="tpl-name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label="Description" htmlFor="tpl-desc" error={errors.description?.message}>
              <Input id="tpl-desc" placeholder="When to use it" {...register("description")} />
            </Field>
            <Field
              label="Prompt / instructions"
              htmlFor="tpl-inst"
              error={errors.instructions?.message}
              hint="For example: keep it under 90 words and end with a yes/no question."
            >
              <Textarea id="tpl-inst" className="min-h-[140px]" aria-invalid={!!errors.instructions} {...register("instructions")} />
            </Field>
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Reused automatically every time you use this template</p>
              <Field
                label="What you offer"
                htmlFor="tpl-offer"
                error={errors.offer?.message}
                hint="What you're selling or who you are, in a sentence or two."
              >
                <Textarea id="tpl-offer" className="min-h-[90px]" aria-invalid={!!errors.offer} {...register("offer")} />
              </Field>
              <Field
                label="Key value proposition"
                htmlFor="tpl-value-prop"
                error={errors.valueProposition?.message}
                hint="The single strongest benefit to lead with."
              >
                <Textarea
                  id="tpl-value-prop"
                  className="min-h-[70px]"
                  aria-invalid={!!errors.valueProposition}
                  {...register("valueProposition")}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} onClick={()=>console.log("clicked")}>
              {template ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TemplateRow({
  template,
  onEdit,
  onDelete,
}: {
  template: Template;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{template.name}</p>
        {template.description && <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Link href={`/dashboard/generate?template=${template.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Use template
        </Link>
        {onEdit && (
          <Button variant="ghost" size="icon" aria-label={`Edit ${template.name}`} onClick={onEdit}>
            <Pencil />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" aria-label={`Delete ${template.name}`} className="hover:text-destructive" onClick={onDelete}>
            <Trash2 />
          </Button>
        )}
      </div>
    </li>
  );
}

export function TemplatesManager({
  starters,
  initialCustom,
  limit,
}: {
  starters: Template[];
  initialCustom: Template[];
  limit: number | null;
}) {
  const [custom, setCustom] = useState(initialCustom);
  const [editing, setEditing] = useState<Template | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    if (limit !== null && custom.length >= limit) {
      return setUpgradeReason(`The Free plan includes ${limit} custom templates. Upgrade to Pro for unlimited templates.`);
    }
    setEditing(null);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteTemplate(toDelete.id);
      if (!res.ok) return void toast.error(res.error);
      setCustom((prev) => prev.filter((t) => t.id !== toDelete.id));
      setToDelete(null);
      toast.success("Template deleted");
    });
  };

  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable instructions that shape how an email is written."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New template
          </Button>
        }
      />

      <section aria-labelledby="your-templates" className="mb-10">
        <h2 id="your-templates" className="mb-3 text-base font-semibold">
          Your templates
          {limit !== null && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {custom.length} of {limit} used
            </span>
          )}
        </h2>
        {custom.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No custom templates yet"
            description="Save the instructions you keep repeating, like a tone, length, or angle, and reuse them in one click."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus /> Create a template
              </Button>
            }
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {custom.map((t) => (
              <TemplateRow
                key={t.id}
                template={t}
                onEdit={() => {
                  setEditing(t);
                  setDialogOpen(true);
                }}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="starter-templates">
        <h2 id="starter-templates" className="mb-3 text-base font-semibold">
          Starter templates
        </h2>
        <ul className="divide-y rounded-lg border">
          {starters.map((t) => (
            <TemplateRow key={t.id} template={t} />
          ))}
        </ul>
      </section>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
        onSaved={(t) =>
          setCustom((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]))
        }
        onLimitReached={setUpgradeReason}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this template?"
        description={`"${toDelete?.name ?? ""}" will be removed. Emails generated with it stay in your history.`}
        confirmLabel="Delete template"
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