import z from "zod";

export const shiftSettingsSchema = z.object({
  category: z.enum(["Morning", "Afternoon", "Evening"]),

  normal_time_in: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
    "Format jam harus HH:mm:ss",
  ),

  normal_time_out: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
    "Format jam harus HH:mm:ss",
  ),
});