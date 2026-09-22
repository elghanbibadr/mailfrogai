-- MailForge AI: initial schema
-- Every table is tied to auth.users(id) and protected by Row Level Security.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  company_name text not null default '',
  company_website text not null default '',
  company_description text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions (written only by the Stripe webhook via the service role)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'free'
    check (status in ('free', 'active', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- usage (one row per user per month; written only through consume_generation())
-- ---------------------------------------------------------------------------
create table public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  generations integer not null default 0 check (generations >= 0),
  window_started_at timestamptz,
  window_count integer not null default 0,
  primary key (user_id, period)
);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  job_title text not null default '',
  company text not null default '',
  website text not null default '',
  email text not null default '',
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Replied', 'Meeting', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_user_created_idx on public.leads (user_id, created_at desc);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- templates (user_id is null for the built-in starter templates)
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  instructions text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index templates_user_idx on public.templates (user_id);
create trigger templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- email_generations
-- ---------------------------------------------------------------------------
create table public.email_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  template_id uuid references public.templates (id) on delete set null,
  prospect_first_name text not null default '',
  prospect_last_name text not null default '',
  prospect_title text not null default '',
  prospect_company text not null default '',
  prospect_website text not null default '',
  sender_name text not null default '',
  sender_company text not null default '',
  offer text not null default '',
  target_customer text not null default '',
  goal text not null,
  value_prop text not null default '',
  tone text not null,
  cta_preference text not null default '',
  context text not null default '',
  subject text not null,
  opening text not null,
  body text not null,
  cta text not null,
  status text not null default 'draft' check (status in ('draft', 'saved', 'sent')),
  model text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_generations_user_created_idx
  on public.email_generations (user_id, created_at desc);
create trigger email_generations_updated_at before update on public.email_generations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + free subscription row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Plan helpers and free-plan limits (enforced in the database, not the client)
-- ---------------------------------------------------------------------------
create or replace function public.is_pro(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions where user_id = p_user_id and status = 'active'
  );
$$;
revoke all on function public.is_pro(uuid) from public, anon, authenticated;

create or replace function public.enforce_lead_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pro(new.user_id)
     and (select count(*) from public.leads where user_id = new.user_id) >= 5 then
    raise exception 'LIMIT_REACHED:leads';
  end if;
  return new;
end $$;

create trigger leads_limit before insert on public.leads
  for each row execute function public.enforce_lead_limit();

create or replace function public.enforce_template_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null
     and not public.is_pro(new.user_id)
     and (select count(*) from public.templates where user_id = new.user_id) >= 3 then
    raise exception 'LIMIT_REACHED:templates';
  end if;
  return new;
end $$;

create trigger templates_limit before insert on public.templates
  for each row execute function public.enforce_template_limit();

-- ---------------------------------------------------------------------------
-- AI generation metering: atomic monthly quota + per-minute rate limit.
-- Returns 'ok', 'limit' (monthly quota reached) or 'rate' (too many requests).
-- Callable only with the service role.
-- ---------------------------------------------------------------------------
create or replace function public.consume_generation(
  p_user_id uuid,
  p_limit integer,
  p_rate_max integer default 6
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_row public.usage%rowtype;
begin
  insert into public.usage (user_id, period) values (p_user_id, v_period)
  on conflict (user_id, period) do nothing;

  select * into v_row from public.usage
  where user_id = p_user_id and period = v_period for update;

  if p_limit is not null and v_row.generations >= p_limit then
    return 'limit';
  end if;

  if v_row.window_started_at is null or now() - v_row.window_started_at > interval '60 seconds' then
    update public.usage
      set generations = generations + 1, window_started_at = now(), window_count = 1
      where user_id = p_user_id and period = v_period;
    return 'ok';
  end if;

  if v_row.window_count >= p_rate_max then
    return 'rate';
  end if;

  update public.usage
    set generations = generations + 1, window_count = window_count + 1
    where user_id = p_user_id and period = v_period;
  return 'ok';
end $$;

-- Gives back one generation when the AI call fails after quota was consumed.
create or replace function public.release_generation(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.usage
    set generations = greatest(generations - 1, 0),
        window_count = greatest(window_count - 1, 0)
    where user_id = p_user_id and period = to_char(now() at time zone 'utc', 'YYYY-MM');
$$;

revoke all on function public.consume_generation(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.release_generation(uuid) from public, anon, authenticated;
grant execute on function public.consume_generation(uuid, integer, integer) to service_role;
grant execute on function public.release_generation(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;
alter table public.leads enable row level security;
alter table public.templates enable row level security;
alter table public.email_generations enable row level security;

-- profiles: read and update your own row. Inserts come from the signup trigger.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- subscriptions and usage: read-only for users. Writes happen with the service role.
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "usage_select_own" on public.usage
  for select to authenticated using (user_id = (select auth.uid()));

-- leads: full access to your own rows
create policy "leads_select_own" on public.leads
  for select to authenticated using (user_id = (select auth.uid()));
create policy "leads_insert_own" on public.leads
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "leads_update_own" on public.leads
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "leads_delete_own" on public.leads
  for delete to authenticated using (user_id = (select auth.uid()));

-- templates: everyone can read starters (user_id is null); only owners can change their own
create policy "templates_select_visible" on public.templates
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "templates_insert_own" on public.templates
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "templates_update_own" on public.templates
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "templates_delete_own" on public.templates
  for delete to authenticated using (user_id = (select auth.uid()));

-- email_generations: own rows only; linked lead/template must be visible to the user
create policy "emails_select_own" on public.email_generations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "emails_insert_own" on public.email_generations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (lead_id is null or exists (
      select 1 from public.leads l where l.id = lead_id and l.user_id = (select auth.uid())))
    and (template_id is null or exists (
      select 1 from public.templates t
      where t.id = template_id and (t.user_id is null or t.user_id = (select auth.uid()))))
  );
create policy "emails_update_own" on public.email_generations
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "emails_delete_own" on public.email_generations
  for delete to authenticated using (user_id = (select auth.uid()));
