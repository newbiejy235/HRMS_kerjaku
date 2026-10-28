import z from "zod";

export const createVerificationSchema = z.object({
  userId: z
    .number()
    .int()
    .positive("User ID harus lebih dari 0"),
});

export const reviewVerificationSchema = z.object({
  reviewedBy: z
    .number()
    .int()
    .positive("Reviewer ID harus lebih dari 0"),

  status: z.enum(["approved", "rejected"], {
    error: "Status harus approved atau rejected",
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: z
    .string()
    .min(6, "Password minimal 6 karakter"),
});

export const employeeResetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: z
    .string()
    .min(6, "Password minimal 6 karakter"),
});

export const hrReviewSchema = z.object({
  requestId: z.number().int().positive("ID request wajib diisi"),
  reviewedBy: z
    .number()
    .int()
    .positive("ID reviewer wajib diisi"),
  status: z.enum(["approved", "rejected"], {
    error: "Status harus approved atau rejected",
  }),
});