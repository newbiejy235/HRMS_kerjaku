import { commonSchemas } from "./schemas/common.schema";
import { authSchemas } from "./schemas/auth.schema";
import { employeeSchemas } from "./schemas/employee.schema";
import { financeSchemas } from "./schemas/finance.schema";

const swaggerDocument: any = {
  openapi: "3.0.3",
  info: {
    title: "Kerjaku HRMS API",
    version: "1.0.0",
    description:
      "Dokumentasi OpenAPI untuk backend HRMS Kerjaku. Dokumen ini dibuat berdasarkan implementasi aktual route, controller, middleware, dan validasi pada repository backend.",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Authentication" },
    { name: "Verification" },
    { name: "Employee" },
    { name: "HR Management" },
    { name: "Shift & Attendance" },
    { name: "Permission & Overtime" },
    { name: "Finance" },
    { name: "Report" },
    { name: "Activation" },
    { name: "Reimbursement" },
    { name: "Attendance Location" },
    { name: "Attendance Statistics" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ...commonSchemas,
      ...authSchemas,
      ...employeeSchemas,
      ...financeSchemas,
    },
  },
  paths: {},
};

// PATHS CHUNK 1
swaggerDocument.paths["/auth/register"] = {
  post: {
    tags: ["Authentication"],
    summary: "Register akun dan data karyawan",
    description: "Membuat akun user dan data karyawan dalam satu transaksi. Validasi email/password dan data karyawan.",
    operationId: "authRegister",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
    },
    responses: {
      "201": {
        description: "Akun dan data karyawan berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    userId: { type: "integer" },
                    employeeId: { type: "string" },
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "409": { description: "Email atau kode karyawan duplikat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/auth/login"] = {
  post: {
    tags: ["Authentication"],
    summary: "Login user",
    description: "Autentikasi email dan password, mengembalikan JWT token.",
    operationId: "authLogin",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
    },
    responses: {
      "200": {
        description: "Berhasil login",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                userData: { $ref: "#/components/schemas/AuthUserData" },
              },
            },
          },
        },
      },
      "404": { description: "Email atau password salah", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/auth/forget"] = {
  post: {
    tags: ["Authentication"],
    summary: "Permintaan reset password",
    description: "Membuat permintaan reset password berstatus pending untuk email yang terdaftar.",
    operationId: "authForgetPassword",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ForgetPasswordRequest" } } },
    },
    responses: {
      "200": { description: "Permintaan diproses", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/auth/reset-with-token"] = {
  post: {
    tags: ["Authentication"],
    summary: "Reset password menggunakan token",
    description: "Memvalidasi token reset password (belum kadaluwarsa dan belum digunakan), lalu mengubah password.",
    operationId: "authResetPasswordWithToken",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordWithTokenRequest" } } },
    },
    responses: {
      "200": { description: "Password berhasil diubah", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Token invalid, kadaluwarsa, sudah digunakan, atau validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};
swaggerDocument.paths["/verification/"] = {
  post: {
    tags: ["Verification"],
    summary: "Buat permintaan reset password (HR review)",
    description: "Membuat password reset request berstatus pending untuk userId.",
    operationId: "verificationCreate",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/VerificationForgetPasswordRequest" } } },
    },
    responses: {
      "200": { description: "Permintaan dibuat", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "404": { description: "User tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/verification/review"] = {
  post: {
    tags: ["Verification"],
    summary: "Review permintaan reset password oleh HR",
    description: "Menyetujui/menolak request. Jika approved, generate OTP dan kirim via Telegram.",
    operationId: "verificationReview",
    security: [],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewForgetPasswordRequest" } } },
    },
    responses: {
      "200": { description: "Request diproses", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal atau karyawan belum menghubungkan Telegram", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Request tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Request sudah diproses sebelumnya", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/data/myProfile"] = {
  get: {
    tags: ["Employee"],
    summary: "Profil karyawan login",
    description: "Mengambil data profil karyawan berdasarkan token login.",
    operationId: "employeeMyProfile",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mendapatkan data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", properties: { user: { $ref: "#/components/schemas/EmployeeProfileData" } } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Pengguna tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/data/my-shift"] = {
  get: {
    tags: ["Employee"],
    summary: "Jadwal shift karyawan login",
    description: "Mengambil jadwal shift milik karyawan yang sedang login.",
    operationId: "employeeMyShift",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mendapatkan jadwal shift",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      shiftId: { type: "integer" },
                      shiftDate: { type: "string", format: "date" },
                      employeeLocate: { type: "string", nullable: true },
                      category: { type: "string", enum: ["Morning", "Afternoon", "Evening"] },
                      normal_time_in: { type: "string" },
                      normal_time_out: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/data/"] = {
  get: {
    tags: ["HR Management"],
    summary: "Daftar semua karyawan",
    description: "Mengambil seluruh data karyawan beserta akun login. Hanya role HR.",
    operationId: "hrGetAllEmployees",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mendapatkan data karyawan",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "array", items: { $ref: "#/components/schemas/EmployeeProfileData" } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/data/my-slip"] = {
  get: {
    tags: ["Employee"],
    summary: "Slip gaji karyawan login",
    description: "Mengambil payroll pertama milik karyawan login beserta detail earning/deduction. Route komentar menyebut query period, tetapi implementasi tidak membaca query.",
    operationId: "employeeMySlip",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil slip gaji",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    payroll: {
                      type: "object",
                      properties: {
                        payrollId: { type: "integer" },
                        employeeId: { type: "string" },
                        payrollPeriod: { type: "string" },
                        totalEarnings: { type: "string" },
                        totalDeductions: { type: "string" },
                        netSalary: { type: "string" },
                      },
                    },
                    details: {
                      type: "object",
                      properties: {
                        earnings: { type: "array", items: { type: "object", additionalProperties: true } },
                        deductions: { type: "array", items: { type: "object", additionalProperties: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Tidak diizinkan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data payroll tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/activation/"] = {
  post: {
    tags: ["Activation"],
    summary: "Aktivasi Telegram bot",
    description: "Menghubungkan chat Telegram ke employee login berdasarkan telegramUserId.",
    operationId: "activationBot",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ActivationRequest" } } },
    },
    responses: {
      "200": { description: "Telegram berhasil diaktifkan", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "telegramUserId tidak valid atau chat ID belum ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};
swaggerDocument.paths["/attendance/qr/generate"] = {
  post: {
    tags: ["Shift & Attendance"],
    summary: "Generate QR code absensi",
    description: "Menghasilkan QR code (data URL), token, dan waktu expired.",
    operationId: "attendanceGenerateQr",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "QR Code berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    qrCode: { type: "string" },
                    token: { type: "string" },
                    expiresAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/attendance/"] = {
  post: {
    tags: ["Shift & Attendance"],
    summary: "Scan absensi kehadiran/pulang",
    description: "Validasi token QR, lalu check-in atau check-out karyawan.",
    operationId: "attendanceScan",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["token"],
            properties: { token: { type: "string" } },
          },
        },
      },
    },
    responses: {
      "200": { description: "Berhasil absensi kehadiran atau pulang", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Token QR wajib dikirim", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Karyawan tidak aktif", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "QR tidak valid atau karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Sudah absen pulang hari ini", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/permission/request/employee"] = {
  post: {
    tags: ["Permission & Overtime"],
    summary: "Ajukan izin karyawan",
    description: "Membuat pengajuan izin/sakit/libur.",
    operationId: "permissionRequestEmployee",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/PermissionRequest" } } },
    },
    responses: {
      "201": {
        description: "Pengajuan izin berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/permission/request/overtime"] = {
  post: {
    tags: ["Permission & Overtime"],
    summary: "Ajukan lembur",
    description: "Membuat pengajuan lembur karyawan.",
    operationId: "permissionRequestOvertime",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/OvertimeRequest" } } },
    },
    responses: {
      "201": {
        description: "Pengajuan lembur berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};
swaggerDocument.paths["/manage/{employeeId}"] = {
  patch: {
    tags: ["HR Management"],
    summary: "Update data karyawan",
    description: "HR memperbarui sebagian field karyawan. Body partial dan strict.",
    operationId: "hrManageEmployee",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "string", maxLength: 30 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ManageEmployeeUpdateRequest" } } },
    },
    responses: {
      "200": { description: "Berhasil update data karyawan", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Validasi gagal atau tidak ada data yang diupdate", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/shift-settings/{id_settings}"] = {
  patch: {
    tags: ["HR Management"],
    summary: "Update pengaturan shift",
    description: "HR memperbarui normal_time_in dan/atau normal_time_out.",
    operationId: "hrUpdateShiftSettings",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "id_settings", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ShiftSettingsUpdateRequest" } } },
    },
    responses: {
      "200": { description: "Berhasil update pengaturan shift", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Validasi gagal atau tidak ada data yang diupdate", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Shift settings tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/shift"] = {
  post: {
    tags: ["HR Management"],
    summary: "Buat jadwal shift karyawan",
    description: "HR membuat jadwal shift untuk karyawan.",
    operationId: "hrCreateEmployeeShift",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/CreateShiftScheduleRequest" } } },
    },
    responses: {
      "201": { description: "Berhasil membuat jadwal shift", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Karyawan atau pengaturan shift tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Jadwal shift duplikat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/shift/{shiftId}"] = {
  patch: {
    tags: ["HR Management"],
    summary: "Update jadwal shift karyawan",
    description: "HR memperbarui jadwal shift. Body partial strict.",
    operationId: "hrUpdateEmployeeShift",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "shiftId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateShiftScheduleRequest" } } },
    },
    responses: {
      "200": { description: "Berhasil update jadwal shift", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Validasi gagal, ID tidak valid, atau tidak ada data", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Jadwal shift tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Jadwal shift duplikat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/"] = {
  get: {
    tags: ["HR Management"],
    summary: "Daftar semua jadwal shift",
    description: "HR mengambil seluruh jadwal shift karyawan.",
    operationId: "hrGetAllShiftSchedules",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mendapatkan jadwal shift",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/attendance"] = {
  get: {
    tags: ["HR Management"],
    summary: "Daftar semua absensi karyawan",
    description: "HR mengambil seluruh data absensi. Response data bersarang (data.data).",
    operationId: "hrGetAllAttendance",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mendapatkan data kehadiran",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data absensi masih kosong", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/excel-report"] = {
  get: {
    tags: ["HR Management"],
    summary: "Export absensi ke Excel",
    description: "Mengunduh file XLSX data absensi.",
    operationId: "hrExportAttendanceExcel",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "File XLSX", content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/export-employee"] = {
  get: {
    tags: ["HR Management"],
    summary: "Export karyawan ke Excel",
    description: "Mengunduh file XLSX data karyawan.",
    operationId: "hrExportEmployeeExcel",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "File XLSX", content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/export-shift"] = {
  get: {
    tags: ["HR Management"],
    summary: "Export jadwal shift ke Excel",
    description: "Mengunduh file XLSX data jadwal shift.",
    operationId: "hrExportShiftExcel",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "File XLSX", content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/response/permission"] = {
  post: {
    tags: ["HR Management"],
    summary: "Respon pengajuan izin",
    description: "HR menyetujui/menolak pengajuan izin. Body tidak divalidasi Zod, menerima status dan id_permission.",
    operationId: "hrResponsePermission",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: false,
      content: { "application/json": { schema: { $ref: "#/components/schemas/HRPermissionResponseRequest" } } },
    },
    responses: {
      "201": { description: "Berhasil menanggapi permintaan", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/manage/response/overtime"] = {
  post: {
    tags: ["HR Management"],
    summary: "Respon pengajuan lembur",
    description: "HR menyetujui/menolak pengajuan lembur. Body tidak divalidasi Zod, menerima status dan id_overtime.",
    operationId: "hrResponseOvertime",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: false,
      content: { "application/json": { schema: { $ref: "#/components/schemas/HROvertimeResponseRequest" } } },
    },
    responses: {
      "201": { description: "Berhasil menanggapi permintaan", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};
swaggerDocument.paths["/finance/components"] = {
  get: {
    tags: ["Finance"],
    summary: "Daftar komponen payroll",
    description: "HR mengambil seluruh komponen payroll.",
    operationId: "financeGetPayrollComponents",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil komponen payroll",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
  post: {
    tags: ["Finance"],
    summary: "Tambah komponen payroll",
    description: "HR menambah komponen payroll. Response sukses tidak menyertakan data.",
    operationId: "financeAddPayrollComponent",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/PayrollComponentRequest" } } },
    },
    responses: {
      "200": { description: "Berhasil menambahkan component", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/components/{id}"] = {
  patch: {
    tags: ["Finance"],
    summary: "Update komponen payroll",
    description: "HR memperbarui komponen payroll berdasarkan id.",
    operationId: "financeUpdatePayrollComponent",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePayrollComponentRequest" } } },
    },
    responses: {
      "200": {
        description: "Berhasil memperbarui component",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Component tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/allocations"] = {
  get: {
    tags: ["Finance"],
    summary: "Daftar semua alokasi payroll",
    description: "HR mengambil semua alokasi komponen payroll karyawan.",
    operationId: "financeGetPayrollAllocations",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil data allocation",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
  post: {
    tags: ["Finance"],
    summary: "Tambah atau update alokasi payroll",
    description: "HR upsert alokasi komponen payroll untuk karyawan.",
    operationId: "financeUpsertPayrollAllocation",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/PayrollAllocationRequest" } } },
    },
    responses: {
      "200": {
        description: "Alokasi berhasil ditambahkan atau diperbarui",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/allocations/{employeeId}"] = {
  get: {
    tags: ["Finance"],
    summary: "Alokasi payroll per karyawan",
    description: "HR mengambil alokasi payroll untuk employeeId tertentu.",
    operationId: "financeGetPayrollAllocationByEmployee",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "string", maxLength: 30 } }],
    responses: {
      "200": {
        description: "Berhasil mengambil allocation karyawan",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "400": { description: "Employee ID tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/payrolls"] = {
  get: {
    tags: ["Finance"],
    summary: "Daftar semua detail payroll",
    description: "HR/Finance mengambil seluruh detail payroll. Query employeeId/payrollPeriod/status disebutkan di komentar route tetapi tidak diimplementasikan controller.",
    operationId: "financeGetAllPayrollDetails",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil seluruh detail payroll",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR/Finance", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/payrolls/all"] = {
  get: {
    tags: ["Finance"],
    summary: "Daftar semua payroll",
    description: "HR/Finance mengambil seluruh payroll beserta data karyawan.",
    operationId: "financeGetAllPayrolls",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil seluruh data slip gaji",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR/Finance", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/finance/payrolls/generate"] = {
  post: {
    tags: ["Finance"],
    summary: "Generate payroll",
    description: "HR/Finance generate payroll berdasarkan alokasi karyawan untuk periode YYYY-MM.",
    operationId: "financeGeneratePayroll",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/GeneratePayrollRequest" } } },
    },
    responses: {
      "201": {
        description: "Payroll berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    payroll: { type: "object", additionalProperties: true },
                    details: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal, karyawan belum memiliki alokasi, atau total potongan melebihi pendapatan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Bukan role HR/Finance", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Payroll untuk karyawan dan periode sudah dibuat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/report-analyst/"] = {
  get: {
    tags: ["Report"],
    summary: "Test Gemini AI",
    description: "Memanggil service analisis Gemini dengan data dummy. Tidak membutuhkan authentication.",
    operationId: "reportTestGemini",
    security: [],
    responses: {
      "200": {
        description: "Berhasil",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "503": { description: "AI sedang sibuk", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Gagal melakukan analisis AI", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};
swaggerDocument.paths["/manage/create/overtime"] = {
  post: {
    tags: ["HR Management"],
    summary: "Buat lembur oleh HR",
    description: "HR membuat pengajuan lembur yang langsung disetujui untuk karyawan tertentu.",
    operationId: "hrCreateOvertime",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/HROvertimeRequest" } } },
    },
    responses: {
      "201": {
        description: "Pengajuan lembur berhasil dibuat",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
      "401": { description: "Sesi tidak valid atau bukan role HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/statistic/attendance-statistics/generate"] = {
  post: {
    tags: ["Attendance Statistics"],
    summary: "Generate statistik kehadiran",
    description: "HR generate statistik kehadiran untuk bulan dan tahun tertentu.",
    operationId: "generateAttendanceStatistics",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["month", "year"],
            properties: {
              month: { type: "integer", minimum: 1, maximum: 12 },
              year: { type: "integer", minimum: 2000 },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Statistik kehadiran berhasil digenerate",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                period: { type: "object", additionalProperties: true },
                totalEmployees: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "400": { description: "Bulan/tahun tidak valid atau periode mendatang", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Akses hanya untuk HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/statistic/attendance-statistics"] = {
  get: {
    tags: ["Attendance Statistics"],
    summary: "Ambil statistik kehadiran",
    description: "HR mengambil seluruh statistik kehadiran berdasarkan bulan dan tahun.",
    operationId: "getAttendanceStatistics",
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
      { name: "year", in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
    ],
    responses: {
      "200": {
        description: "Statistik kehadiran berhasil diambil",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "400": { description: "Bulan atau tahun tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Akses hanya untuk HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/statistic/attendance-statistics/{employeeId}"] = {
  get: {
    tags: ["Attendance Statistics"],
    summary: "Ambil statistik kehadiran karyawan",
    description: "HR mengambil statistik kehadiran untuk satu karyawan berdasarkan employeeId, bulan, dan tahun.",
    operationId: "getEmployeeAttendanceStatistics",
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: "employeeId", in: "path", required: true, schema: { type: "string", minLength: 1, maxLength: 30 } },
      { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
      { name: "year", in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
    ],
    responses: {
      "200": {
        description: "Statistik karyawan berhasil diambil",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      "400": { description: "Parameter tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Akses hanya untuk HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Statistik karyawan tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/employee/loation/"] = {
  post: {
    tags: ["Attendance Location"],
    summary: "Buat lokasi absensi",
    description: "HR membuat lokasi absensi perusahaan. Hanya satu lokasi yang dapat tersedia.",
    operationId: "createAttendanceLocation",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceLocationRequest" } } },
    },
    responses: {
      "201": { description: "Lokasi absensi berhasil ditambahkan", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Data lokasi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Hanya HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Lokasi perusahaan sudah tersedia", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
  get: {
    tags: ["Attendance Location"],
    summary: "Ambil lokasi absensi",
    description: "Mengambil lokasi absensi perusahaan yang tersimpan.",
    operationId: "getAttendanceLocation",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "Berhasil mengambil lokasi absensi", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Lokasi absensi belum dikonfigurasi", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/employee/loation/{id}"] = {
  put: {
    tags: ["Attendance Location"],
    summary: "Update lokasi absensi",
    description: "HR memperbarui data lokasi absensi perusahaan.",
    operationId: "updateAttendanceLocation",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAttendanceLocationRequest" } } },
    },
    responses: {
      "200": { description: "Lokasi absensi berhasil diperbarui", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "ID lokasi tidak valid atau tidak ada data yang dikirim", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Hanya HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Lokasi absensi tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
  patch: {
    tags: ["Attendance Location"],
    summary: "Update status lokasi absensi",
    description: "HR mengubah status aktif lokasi absensi.",
    operationId: "updateAttendanceLocationStatus",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceLocationStatusRequest" } } },
    },
    responses: {
      "200": { description: "Status lokasi berhasil diperbarui", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "ID lokasi tidak valid atau status tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Hanya HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Lokasi absensi tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/reimbursements/"] = {
  post: {
    tags: ["Reimbursement"],
    summary: "Ajukan reimburse",
    description: "Karyawan mengajukan reimburse dengan upload foto bukti.",
    operationId: "createReimbursement",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["name", "amount", "expenseDate", "receipt"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              amount: { type: "number", minimum: 0.01 },
              expenseDate: { type: "string", format: "date" },
              receipt: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
    responses: {
      "201": { description: "Pengajuan reimburse berhasil dibuat", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "Data tidak valid atau foto bukti wajib diunggah", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
  get: {
    tags: ["Reimbursement"],
    summary: "Daftar reimburse milik karyawan",
    description: "Karyawan melihat daftar reimburse miliknya.",
    operationId: "getReimbursements",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Berhasil mengambil data reimburse",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                total: { type: "integer" },
                data: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

swaggerDocument.paths["/reimbursements/{id}/review"] = {
  patch: {
    tags: ["Reimbursement"],
    summary: "Review reimburse oleh HR",
    description: "HR menyetujui atau menolak reimburse. Jika ditolak, alasan penolakan wajib diisi.",
    operationId: "reviewReimbursement",
    security: [{ BearerAuth: [] }],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ReimbursementReviewRequest" } } },
    },
    responses: {
      "200": { description: "Reimburse berhasil direview", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: { type: "object", additionalProperties: true } } } } } },
      "400": { description: "ID tidak valid atau status tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "401": { description: "Sesi tidak valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "403": { description: "Hanya HR", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "404": { description: "Data reimburse tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "409": { description: "Reimburse sudah direview", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      "500": { description: "Kesalahan server", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  },
};

export default swaggerDocument;
