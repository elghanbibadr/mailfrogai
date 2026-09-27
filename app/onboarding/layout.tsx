import { AuthShell } from "@/components/auth/auth-shell";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell
      headline="One quick step before you start."
      subcopy="Tell us about your business once. We'll pre-fill it every time you generate an email — you can change it later in Settings."
      logoHref="/dashboard"
    >
      {children}
    </AuthShell>
  );
}
