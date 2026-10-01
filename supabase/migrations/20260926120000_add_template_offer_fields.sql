-- supabase/migrations/20260926120000_add_template_offer_fields.sql
--
-- Ajoute à chaque template son "offre" et sa "proposition de valeur clé",
-- pour que la génération d'email les réutilise automatiquement sans
-- avoir à les ressaisir à chaque fois qu'on utilise ce template.

alter table public.templates
  add column if not exists offer text,
  add column if not exists value_proposition text;

comment on column public.templates.offer is
  'Description de ce que propose l''utilisateur (produit/service), réutilisée automatiquement à chaque génération basée sur ce template.';

comment on column public.templates.value_proposition is
  'Proposition de valeur clé (le bénéfice principal mis en avant), réutilisée automatiquement à chaque génération basée sur ce template.';

-- Optionnel mais recommandé : empêcher la génération tant que ces deux
-- champs ne sont pas renseignés, pour garantir qu'on ne tombe jamais sur
-- un prompt incomplet au moment de générer.
alter table public.templates
  add constraint templates_offer_not_blank
    check (offer is null or length(trim(offer)) > 0),
  add constraint templates_value_proposition_not_blank
    check (value_proposition is null or length(trim(value_proposition)) > 0);