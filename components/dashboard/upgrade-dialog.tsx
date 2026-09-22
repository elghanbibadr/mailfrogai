"use client";

import { Check } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/billing-buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRO_PRICE_USD } from "@/lib/constants";

const PRO_FEATURES = [
  "Unlimited AI generations",
  "Unlimited saved leads",
  "Unlimited custom templates",
  "Priority generation with a stronger model",
];

export function UpgradeDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-background p-4">
          <p className="text-2xl font-semibold tracking-tight">
            ${PRO_PRICE_USD}
            <span className="text-sm font-normal text-muted-foreground"> / month</span>
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <UpgradeButton size="lg" className="w-full" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
