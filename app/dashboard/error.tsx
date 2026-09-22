"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
      <h2 className="font-medium">Something went wrong loading this page</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{error.message || "Try again in a moment."}</p>
      <Button className="mt-5" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
