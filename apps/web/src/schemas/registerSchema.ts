import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Must be a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Minimum 6 characters required"),
  githubUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  otp: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
