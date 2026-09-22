import { Sparkles } from "lucide-react";

export function MockGenerator() {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 border-b bg-card/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-muted-foreground">MailForge AI — Generate Email</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="space-y-3 border-b p-5 sm:border-b-0 sm:border-r">
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">Prospect</p>
            <div className="rounded-md border bg-background px-3 py-2 text-sm">Maya Chen, VP Marketing at Northwind</div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">What you offer</p>
            <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              AI-powered onboarding flows for B2B SaaS
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">Tone</p>
            <div className="inline-flex rounded-md border bg-background px-3 py-1.5 text-xs">Friendly</div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Sparkles className="size-4" aria-hidden /> Generate Email
          </div>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-[11px] text-muted-foreground">Subject</p>
          <p className="text-sm font-medium">Quick idea for Northwind&apos;s onboarding</p>
          <p className="text-[11px] text-muted-foreground">Opening</p>
          <p className="text-sm text-muted-foreground">Hi Maya, saw Northwind is scaling its self-serve signups...</p>
          <p className="text-[11px] text-muted-foreground">Call to action</p>
          <p className="text-sm text-muted-foreground">Worth a 15-minute call next week?</p>
        </div>
      </div>
    </div>
  );
}
