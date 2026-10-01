// lib/validations/template.ts
//
// Schéma complet du template — j'avais initialement omis "description"
// et "prompt" en me concentrant sur l'ajout de offer/valueProposition.
// Les voici réintégrés :
//   - description : repère humain affiché dans le sélecteur de templates
//     (jamais envoyé au modèle)
//   - prompt       : instructions explicites données à l'IA (longueur,
//     ton, règles à suivre), complémentaires à "structure"

import { z } from "zod";

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Donne un nom à ton template")
    .max(80, "80 caractères maximum"),

  description: z
    .string()
    .max(200, "200 caractères maximum")
    .optional(),

  tone: z.enum(["professionnel", "decontracte", "direct", "chaleureux"]),

  structure: z
    .string()
    .min(1, "Décris la structure de l'email (accroche, corps, CTA...)"),

  prompt: z
    .string()
    .min(1, "Donne les instructions à suivre par l'IA")
    .max(1000, "1000 caractères maximum"),

  offer: z
    .string()
    .min(10, "Décris ton offre en quelques mots (10 caractères minimum)")
    .max(500, "500 caractères maximum"),

  valueProposition: z
    .string()
    .min(10, "Décris ta proposition de valeur clé (10 caractères minimum)")
    .max(300, "300 caractères maximum"),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

// Les mêmes valeurs, telles que stockées/lues côté Supabase
// (snake_case en base, camelCase côté app).
export interface TemplateRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tone: TemplateFormValues["tone"];
  structure: string;
  prompt: string;
  offer: string;
  value_proposition: string;
  created_at: string;
  updated_at: string;
}

export function templateRecordToFormValues(record: TemplateRecord): TemplateFormValues {
  return {
    name: record.name,
    description: record.description ?? "",
    tone: record.tone,
    structure: record.structure,
    prompt: record.prompt,
    offer: record.offer,
    valueProposition: record.value_proposition,
  };
}