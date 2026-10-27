import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "password minimum 6 char"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "password minimum 6 char"),
});

export const employe = z.object({
  firstName : z.string().min(1, "name minimum 1 char"),
  noTelp : z.string().min(10, "minimum 10 char").max(13, "maksimum 13 char"),
  noRek : z.string().min(10, "minimum 10 char").max(18, "maksimum 18 char"),
  nip : z.string().min(10, "minimum 10 char"),
  
})
