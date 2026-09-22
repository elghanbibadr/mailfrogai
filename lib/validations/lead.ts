import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/constants";
import { websiteField } from "@/lib/validations/generator";

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  job_title: z.string().trim().max(120),
  company: z.string().trim().max(120),
  website: websiteField,
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email"),
  status: z.enum(LEAD_STATUSES),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const emptyLead: LeadInput = {
  name: "",
  job_title: "",
  company: "",
  website: "",
  email: "",
  status: "New",
};
