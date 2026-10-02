import { z } from "zod";
import { GOALS, TONES } from "@/lib/constants";

const websiteRegex = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;

export const websiteField = z
  .string()
  .trim()
  .max(200, "Keep this under 200 characters")
  .refine(
    (v) => v === "" || websiteRegex.test(v),
    "Enter a valid website, like acme.com",
  );

export const generatorSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter the prospect's first name")
    .max(80),
  lastName: z.string().trim().max(80),
  jobTitle: z.string().trim().max(120),
  company: z.string().trim().min(1, "Enter the prospect's company").max(120),
  website: websiteField,
  yourName: z.string().trim().min(1, "Enter your name").max(80),
  yourCompany: z.string().trim().max(120),
  offer: z
    .string()
    .trim()
    .min(10, "Describe what you offer in a sentence or two")
    .max(1000),
  targetCustomer: z.string().trim().max(300),
  goal: z.enum(GOALS),
  valueProp: z.string().trim().min(5, "Add the key value you deliver").max(500),
  tone: z.enum(TONES),
  cta: z.string().trim().max(200),
  context: z.string().trim().max(2000, "Keep context under 2,000 characters"),
  templateId: z.union([z.string().uuid(), z.literal("")]),
  leadId: z.union([z.string().uuid(), z.literal("")]),
});

export type GeneratorInput = z.infer<typeof generatorSchema>;

const isDev = process.env.NODE_ENV !== "production";

/**
 * Dev-only convenience defaults so you don't have to refill the form on every
 * test run. In production this always resolves to the empty version below —
 * do not remove this check.
 */
export const emptyGenerator: GeneratorInput = isDev
  ? {
      firstName: "",
      lastName: "",
      jobTitle: "",
      company: "",
      website: "",
      yourName: "",
      yourCompany: "",
      offer: "",
      targetCustomer: "",
      goal: "",
      valueProp: "",
      tone: "Direct",
      cta: "",
      context: "",
      templateId: "",
      leadId: "",
    }
  : {
      firstName: "",
      lastName: "",
      jobTitle: "",
      company: "",
      website: "",
      yourName: "",
      yourCompany: "",
      offer: "",
      targetCustomer: "",
      goal: "Book a meeting",
      valueProp: "",
      tone: "Professional",
      cta: "",
      context: "",
      templateId: "",
      leadId: "",
    };
/** Shape the model must return. */
export const generatedEmailSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  opening: z.string().trim().min(1).max(400),
  body: z.string().trim().min(1).max(2500),
  cta: z.string().trim().min(1).max(400),
});

export type GeneratedEmail = z.infer<typeof generatedEmailSchema>;
