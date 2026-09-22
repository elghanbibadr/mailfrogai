"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

async function redirectTo(endpoint: string, fallbackError: string) {
  const res = await fetch(endpoint, { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? fallbackError);
  window.location.href = data.url;
}

export function UpgradeButton({ children = "Upgrade to Pro", ...props }: ButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      {...props}
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await redirectTo("/api/stripe/checkout", "Couldn't start checkout.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Couldn't start checkout.");
          setLoading(false);
        }
      }}
    >
      {children}
    </Button>
  );
}

export function ManageBillingButton({ children = "Manage subscription", ...props }: ButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      {...props}
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await redirectTo("/api/stripe/portal", "Couldn't open the billing portal.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Couldn't open the billing portal.");
          setLoading(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
