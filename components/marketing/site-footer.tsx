import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-sm" />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/#features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-foreground">
            Sign up
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MailForge AI. A portfolio project.</p>
      </div>
    </footer>
  );
}
