import { z } from "zod";

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Donne un nom à ton template")
    .max(80, "80 caractères maximum"),

  description: z
    .string()
    .max(200, "200 caractères maximum")
    .optional()
    .default(""),

  instructions: z
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

export type TemplateInput = z.infer<typeof templateSchema>;

export interface TemplateRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  instructions: string;
  offer: string;
  value_proposition: string;
  created_at: string;
  updated_at: string;
}

export function templateRecordToFormValues(record: TemplateRecord): TemplateInput {
  return {
    name: record.name,
    description: record.description ?? "",
    instructions: record.instructions,
    offer: record.offer,
    valueProposition: record.value_proposition,
  };
}