export const FREE_LIMITS = { generations: 10, leads: 5, templates: 3 } as const;
export const PRO_PRICE_USD = 12;

export const GOALS = [
  "Book a meeting",
  "Get a reply",
  "Introduce a service",
  "Follow up",
  "Partnership",
] as const;

export const TONES = ["Professional", "Friendly", "Casual", "Direct", "Persuasive"] as const;

export const LEAD_STATUSES = ["New", "Contacted", "Replied", "Meeting", "Closed"] as const;


export const SUBSCRIPTION_STATUSES = ["free", "active", "canceled", "past_due"] as const;

export const LEAD_STATUS_STYLES: Record<(typeof LEAD_STATUSES)[number], string> = {
  New: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  Contacted: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Replied: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  Meeting: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Closed: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

export const EMAIL_STATUS_STYLES: Record<(typeof EMAIL_STATUSES)[number], string> = {
  draft: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  saved: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  sending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  sent: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};
export const EMAIL_STATUSES = ["draft", "saved", "sending", "sent"] as const;

/** Statuses the client may set directly. "sending" is reserved for the send action. */
export const SETTABLE_EMAIL_STATUSES = ["draft", "saved", "sent"] as const;