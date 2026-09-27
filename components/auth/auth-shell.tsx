import { AuthIllustration } from "@/components/auth/auth-illustration";
import { Logo } from "@/components/logo";

export function AuthShell({
  headline,
  subcopy,
  logoHref = "/",
  children,
}: {
  headline: string;
  subcopy: string;
  logoHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Illustration panel — desktop only. Mobile keeps the flow focused on the form. */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-card/40 p-10 lg:flex">
        <Logo href={logoHref} />
        <AuthIllustration className="mx-auto" />
        <div className="max-w-sm">
          <p className="text-lg font-medium leading-snug">{headline}</p>
          <p className="mt-2 text-sm text-muted-foreground">{subcopy}</p>
        </div>
      </div>

      <div className="flex flex-col">
        <header className="px-6 py-5 lg:hidden">
          <Logo href={logoHref} />
        </header>
        <main className="flex flex-1 items-start justify-center px-4  pt-8 sm:items-center sm:pt-0">
          <div className="w-full max-w-sm rounded-xl border bg-card p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
