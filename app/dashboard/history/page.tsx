import { HistoryList } from "@/components/emails/history-list";
import { requireUser } from "@/lib/auth";
import type { EmailGeneration } from "@/types";

export const metadata = { title: "History" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; open?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("email_generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <HistoryList
      initialEmails={(data ?? []) as EmailGeneration[]}
      initialQuery={sp.q?.slice(0, 200) ?? ""}
      initialOpenId={sp.open ?? null}
    />
  );
}
