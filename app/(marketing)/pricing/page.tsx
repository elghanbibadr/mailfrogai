import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_LIMITS, PRO_PRICE_USD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Try MailForge AI on a handful of real prospects.",
    features: [
      `${FREE_LIMITS.generations} AI generations / month`,
      `${FREE_LIMITS.leads} saved leads`,
      `${FREE_LIMITS.templates} custom templates`,
    ],
    cta: { label: "Get started", href: "/signup" },
  },
  {
    name: "Pro",
    price: `$${PRO_PRICE_USD}`,
    period: "/month",
    description: "For ongoing outreach without limits.",
    features: ["Unlimited AI generations", "Unlimited leads", "Unlimited templates", "Priority generation"],
    cta: { label: "Get started", href: "/signup" },
    highlighted: true,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Simple, honest pricing</h1>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade only when you need more.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn("relative", plan.highlighted && "border-primary/50 shadow-lg shadow-primary/10")}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <CardContent className="p-7">
              <h2 className="font-medium">{plan.name}</h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={cn(buttonVariants({ variant: plan.highlighted ? "default" : "outline" }), "mt-7 w-full")}
              >
                {plan.cta.label}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button asChild variant="link" className="h-auto p-0 text-sm">
          <Link href="/login">Log in</Link>
        </Button>{" "}
        and upgrade from Settings.
      </p>
    </div>
  );
}
