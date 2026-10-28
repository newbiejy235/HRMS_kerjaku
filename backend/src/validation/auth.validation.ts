import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "password minimum 6 char"),
});

export const loginSchema = z.object({
  email: z.email(),

  password: z.string().min(6, "password minimum 6 char"),
});

