import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      notice={error === "confirmation" ? "That confirmation link is invalid or has expired. Log in or sign up again." : undefined}
    />
  );
}
