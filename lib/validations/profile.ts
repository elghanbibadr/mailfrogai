import { z } from "zod";
import { websiteField } from "@/lib/validations/generator";

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name").max(80),
  company_name: z.string().trim().max(120),
  company_website: websiteField,
  company_description: z.string().trim().max(1000),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const nameSchema = profileSchema.pick({ full_name: true });
export const companySchema = profileSchema.omit({ full_name: true });
export type NameInput = z.infer<typeof nameSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
