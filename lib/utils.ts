import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Billing/usage period key, e.g. "2026-09" (UTC). Must match consume_generation() in SQL. */
export function currentPeriod(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}

export function initials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || email || "?";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function splitName(full: string) {
  const [first = "", ...rest] = full.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function getAppUrl(req?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}
