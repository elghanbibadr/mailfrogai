import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell
      headline="Cold emails that read like you wrote them."
      subcopy="Describe a prospect and your offer — MailForge writes the subject, opening, body and one clear call to action."
    >
      {children}
    </AuthShell>
  );
}
