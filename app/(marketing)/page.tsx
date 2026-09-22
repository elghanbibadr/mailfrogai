import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { MockGenerator } from "@/components/marketing/mock-generator";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PRO_PRICE_USD } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Add a prospect", description: "Name, role, company, and website — or pull one from your saved leads." },
  { title: "Describe your offer", description: "What you sell, who it's for, and the outcome you want from this email." },
  { title: "Generate and refine", description: "Get a subject, opening, body and one clear CTA. Edit anything before you save it." },
];

const FEATURES = [
  { icon: Sparkles, title: "AI email generation", description: "Structured output tuned for real replies: no filler, no fake personalization, one clear ask." },
  { icon: Users, title: "Lead management", description: "Save prospects with status tracking, then generate an email for any of them in one click." },
  { icon: FileText, title: "Reusable templates", description: "Turn a tone or angle you like into a template and apply it to every future generation." },
];

const FAQ = [
  { q: "Does the AI make up details about my prospect?", a: "No. It only uses what you provide — name, role, company, and any context you paste in. If you give it little to work with, it writes an honest, relevant email instead of inventing personalization." },
  { q: "What happens when I hit the Free plan limit?", a: "You'll see an upgrade prompt with the option to switch to Pro at any time. Nothing you've already generated is affected." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel your subscription from Settings whenever you like; you'll keep Pro access until the end of the billing period." },
  { q: "Is my data private?", a: "Every lead, template and generated email is scoped to your account with database-level access rules — no one else can read them." },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Zap className="size-3.5 text-primary" aria-hidden /> AI-powered cold outreach
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Write cold emails that <span className="text-primary">actually feel personal.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          MailForge AI helps you turn a prospect, company, and offer into personalized cold emails in seconds.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Generate your first email <ArrowRight />
          </Link>
          <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
            View pricing
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24">
        <MockGenerator />
      </section>

      <section id="how-it-works" className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Everything you need to send better outreach</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" aria-hidden /> Simple pricing
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  Free to start, ${PRO_PRICE_USD}/mo for unlimited
                </p>
              </div>
              <Link href="/pricing" className={buttonVariants()}>
                See plans <ArrowRight />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="faq" className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-10 divide-y rounded-lg border">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium">
                  {q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={cn("border-t border-border/60 px-6 py-20 text-center")}>
        <h2 className="text-2xl font-semibold sm:text-3xl">Ready to write your next email?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Set up takes under a minute. Your first 10 generations are free.
        </p>
        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
          Generate your first email <ArrowRight />
        </Link>
      </section>
    </>
  );
}
