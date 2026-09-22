import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** For server actions and route handlers: returns null instead of redirecting. */
export async function getAuthed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** For pages and layouts: redirects to /login when signed out. */
export async function requireUser() {
  const ctx = await getAuthed();
  if (!ctx) redirect("/login");
  return ctx;
}
