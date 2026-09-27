import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUser } from "@/lib/auth";
import type { Profile } from "@/types";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;

  // Already done — don't let a bookmarked/back-navigated link show this again.
  if (profile?.onboarded) redirect("/dashboard");

  return (
    <OnboardingFlow
      defaults={{
        full_name: profile?.full_name ?? "",
        company_name: profile?.company_name ?? "",
        company_website: profile?.company_website ?? "",
        company_description: profile?.company_description ?? "",
      }}
    />
  );
}
