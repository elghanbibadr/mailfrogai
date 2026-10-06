import type {
  EMAIL_STATUSES,
  GOALS,
  LEAD_STATUSES,
  SUBSCRIPTION_STATUSES,
  TONES,
} from "@/lib/constants";

export type Goal = (typeof GOALS)[number];
export type Tone = (typeof TONES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type Profile = {
  id: string;
  email: string | null;
  full_name: string;
  company_name: string;
  company_website: string;
  company_description: string;
  onboarded: boolean;
  created_at: string;
};

export type Subscription = {
  user_id: string;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type Lead = {
  id: string;
  user_id: string;
  name: string;
  job_title: string;
  company: string;
  website: string;
  email: string;
  status: LeadStatus;
  created_at: string;
};

export type Template = {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  offer: string
  instructions: string;
  value_proposition: string
  created_at: string;
};
export type EmailGeneration = {
  id: string;
  user_id: string;
  lead_id: string | null;
  template_id: string | null;
  prospect_first_name: string;
  prospect_last_name: string;
  prospect_title: string;
  prospect_company: string;
  prospect_website: string;
  sender_name: string;
  sender_company: string;
  offer: string;
  target_customer: string;
  goal: Goal;
  value_prop: string;
  tone: Tone;
  cta_preference: string;
  context: string;
  subject: string;
  opening: string;
  body: string;
  cta: string;
  status: EmailStatus;
  model: string;
  recipient_email: string | null;
  sent_at: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  created_at: string;
  updated_at: string;
};
export type UsageSnapshot = {
  isPro: boolean;
  subscription: Subscription | null;
  generationsThisMonth: number;
  generationsTotal: number;
  leadCount: number;
  templateCount: number;
  limits: { generations: number | null; leads: number | null; templates: number | null };
};
