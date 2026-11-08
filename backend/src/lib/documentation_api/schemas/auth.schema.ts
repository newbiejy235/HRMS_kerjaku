export const authSchemas: Record<string, any> = {
  RegisterRequest: {
    type: "object",
    required: [
      "email",
      "password",
      "firstName",
      "gender",
      "noTelp",
      "cities_id",
      "noRek",
      "nip",
      "hire_date",
      "idPosition",
      "idDepartment",
    ],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      firstName: { type: "string", minLength: 1, maxLength: 255 },
      lastName: { type: "string", maxLength: 255, nullable: true },
      gender: { type: "string", enum: ["L", "P"] },
      noTelp: { type: "string", minLength: 10, maxLength: 13, pattern: "^[0-9]+$" },
      cities_id: { type: "integer", minimum: 1 },
      noRek: { type: "string", minLength: 10, maxLength: 100 },
      nip: { type: "string", minLength: 10, maxLength: 100 },
      NPWP: { type: "string", minLength: 16, maxLength: 16, pattern: "^[0-9]+$", nullable: true },
      BPJS_Kesehatan: { type: "string", maxLength: 100, nullable: true },
      BPJS_Ketenagakerjaan: { type: "string", maxLength: 100, nullable: true },
      hire_date: { type: "string", format: "date" },
      resign_date: { type: "string", format: "date", nullable: true },
      idPosition: { type: "integer", minimum: 1 },
      idDepartment: { type: "integer", minimum: 1 },
      employment_status: { type: "string", enum: ["active", "fired"], default: "active" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
    },
  },
  ForgetPasswordRequest: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
  },
  ResetPasswordWithTokenRequest: {
    type: "object",
    required: ["token", "newPassword"],
    properties: {
      token: { type: "string", minLength: 1 },
      newPassword: { type: "string", minLength: 6 },
    },
  },
  VerificationForgetPasswordRequest: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "integer", minimum: 1 },
    },
  },
  ReviewForgetPasswordRequest: {
    type: "object",
    required: ["requestId", "status"],
    properties: {
      requestId: { type: "integer", minimum: 1 },
      status: { type: "string", enum: ["approved", "rejected"] },
    },
  },
  AuthUserData: {
    type: "object",
    properties: {
      userId: { type: "integer" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["Karyawan", "Finance", "HR"] },
      token: { type: "string" },
    },
  },
};
