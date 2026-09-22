import { z } from "zod";
import { EMAIL_STATUSES } from "@/lib/constants";

export const emailEditSchema = z.object({
  subject: z.string().trim().min(1, "Subject can't be empty").max(150),
  opening: z.string().trim().min(1, "Opening can't be empty").max(400),
  body: z.string().trim().min(1, "Body can't be empty").max(2500),
  cta: z.string().trim().min(1, "Call to action can't be empty").max(400),
});

export type EmailEditInput = z.infer<typeof emailEditSchema>;
export const emailStatusSchema = z.enum(EMAIL_STATUSES);
export const uuidSchema = z.string().uuid();
