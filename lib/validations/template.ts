import { z } from "zod";

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Give the template a name").max(80),
  description: z.string().trim().max(200),
  instructions: z
    .string()
    .trim()
    .min(10, "Add instructions the AI should follow")
    .max(2000, "Keep instructions under 2,000 characters"),
});

export type TemplateInput = z.infer<typeof templateSchema>;
