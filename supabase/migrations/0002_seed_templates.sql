-- Starter templates, visible to every signed-in user (user_id is null, so they are read-only).
insert into public.templates (id, user_id, name, description, instructions) values
(
  '00000000-0000-4000-8000-000000000001', null,
  'Cold introduction',
  'A short first touch for someone who has never heard of you.',
  'Introduce the sender to someone who does not know them. Open with one relevant observation about the prospect''s role or industry, connect it to a problem the sender solves, and keep it under 100 words. Ask a low-pressure question.'
),
(
  '00000000-0000-4000-8000-000000000002', null,
  'Agency outreach',
  'Pitch services to a business that could use outside help.',
  'The sender runs an agency or consultancy. Lead with a specific outcome clients get, not a list of services. Mention one relevant type of result, then ask whether the prospect wants to see how it would work for their company.'
),
(
  '00000000-0000-4000-8000-000000000003', null,
  'SaaS outreach',
  'Introduce a software product to a likely buyer.',
  'The sender sells a software product. Describe the problem in the prospect''s words, say in one sentence how the product removes it, and offer a short demo or a look at a relevant example. Avoid feature lists.'
),
(
  '00000000-0000-4000-8000-000000000004', null,
  'Recruiter outreach',
  'Reach a candidate about a role without sounding like a mass message.',
  'The sender is a recruiter contacting a candidate. State the role and one concrete reason it might fit the candidate''s background, using only details provided. Be upfront about what is known and unknown, and ask if they are open to a short conversation.'
),
(
  '00000000-0000-4000-8000-000000000005', null,
  'Partnership',
  'Propose working together with a complementary business.',
  'The sender proposes a partnership. Explain in one sentence why the two audiences or products fit together, describe one specific way to collaborate, and ask for a short call to explore it.'
),
(
  '00000000-0000-4000-8000-000000000006', null,
  'Follow-up',
  'A brief nudge after no reply.',
  'This is a follow-up to an earlier email that got no reply. Keep it under 60 words. Do not guilt-trip or say "just checking in". Add one new piece of value or a simpler question, and make it easy to say yes or no.'
)
on conflict (id) do nothing;
