import { Search } from "lucide-react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import type { UsageSnapshot } from "@/types";

export function Topbar({
  name,
  email,
  usage,
}: {
  name: string;
  email: string;
  usage: UsageSnapshot;
}) {
  const { generationsThisMonth, limits, isPro } = usage;
  const limit = limits.generations;
  const nearLimit = limit !== null && generationsThisMonth >= limit * 0.8;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:px-8">
      <MobileNav isPro={isPro} />

      {/* Plain GET form: works without JavaScript and lands on the searchable history. */}
      <form action="/dashboard/history" method="get" role="search" className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          aria-label="Search generated emails"
          placeholder="Search emails"
          className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        {isPro ? (
          <Badge className="border-primary/30 bg-primary/10 text-primary">Pro</Badge>
        ) : (
          <div
            className="hidden items-center gap-2 text-sm sm:flex"
            title="AI generations used this month"
          >
            <span className="text-muted-foreground">Generations</span>
            <span
              className={
                nearLimit ? "font-medium tabular-nums text-amber-300" : "font-medium tabular-nums"
              }
            >
              {generationsThisMonth} / {limit}
            </span>
          </div>
        )}
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
