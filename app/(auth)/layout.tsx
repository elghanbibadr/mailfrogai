import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-24 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm rounded-xl border bg-card p-7">{children}</div>
      </main>
    </div>
  );
}
