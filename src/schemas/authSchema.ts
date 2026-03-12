import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
    confirmPassword: z.string().min(1),
    fullName: z.string().min(2).max(100),
    role: z.literal("STUDENT"),
  })
  .refine((v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
