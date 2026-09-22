import { TemplatesManager } from "@/components/templates/templates-manager";
import { requireUser } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import type { Template } from "@/types";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const { supabase, user } = await requireUser();
  const [{ data }, usage] = await Promise.all([
    supabase.from("templates").select("*").order("created_at", { ascending: true }),
    getUsage(supabase, user.id),
  ]);
  const all = (data ?? []) as Template[];

  return (
    <TemplatesManager
      starters={all.filter((t) => t.user_id === null)}
      initialCustom={all.filter((t) => t.user_id === user.id)}
      limit={usage.limits.templates}
    />
  );
}
