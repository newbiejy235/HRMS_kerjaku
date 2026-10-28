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