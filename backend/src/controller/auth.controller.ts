import { db } from "../config/db";
import { Request, Response } from "express";
import {
  usersTable,
  employes,
  cities,
  position,
  department,
  passwordResetRequests,
} from "../config/schema";
import { employe } from "../validation/employe.validation";
import { loginSchema, registerSchema } from "../validation/auth.validation";
import { forgotPasswordSchema, resetPasswordSchema, employeeResetPasswordSchema } from "../validation/verification.validation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import dotenv from "dotenv";

// Generate employee code yang unik terhadap DB
async function generateEmployeeCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = `emp-${Math.floor(10000 + Math.random() * 90000)}`;

    const exists = await db
      .select({ employeeId: employes.employeeId })
      .from(employes)
      .where(eq(employes.employeeId, code));

    if (exists.length === 0) return code;
  }
  throw new Error("Gagal generate employee code unik");
}

// Generate secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export class Authentication {
  register = async (req: Request, res: Response) => {
    try {
      // 1. Validasi data karyawan
      const employeeData = employe
        .omit({ userId: true, employeeId: true })
        .parse(req.body);

      // 2. Validasi email dan password
      const { email, password } = registerSchema.parse(req.body);

      // 3. Cek apakah email sudah digunakan
      const existingAccount = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (existingAccount.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      // 4. Cek foreign key SEBELUM membuat user
      const [cityExists, positionExists, departmentExists] = await Promise.all([
        db.select().from(cities).where(eq(cities.id, employeeData.cities_id)),
        db
          .select()
          .from(position)
          .where(eq(position.id_position, employeeData.idPosition)),
        db
          .select()
          .from(department)
          .where(eq(department.id_department, employeeData.idDepartment)),
      ]);

      if (
        cityExists.length === 0 ||
        positionExists.length === 0 ||
        departmentExists.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Kota, posisi, atau department tidak ditemukan",
        });
      }

      // 5. Hash password & generate employee code
      const hashedPassword = await bcrypt.hash(password, 10);
      const employee_code = await generateEmployeeCode();

      // 6. db.batch() = satu transaction di neon-http (atomik).
      //    userId employee diambil lewat subquery dari email yang baru diinsert.
      const [userResult] = await db.batch([
        db
          .insert(usersTable)
          .values({ email, password: hashedPassword })
          .returning({ id: usersTable.id, email: usersTable.email }),

        db.insert(employes).values({
          ...employeeData,
          employeeId: employee_code,
          userId: sql`(select ${usersTable.id} from ${usersTable} where ${usersTable.email} = ${email})`,
        }),
      ]);

      const newUser = userResult[0];

      // 7. Respons berhasil
      return res.status(201).json({
        success: true,
        message: "Akun dan data karyawan berhasil dibuat",
        data: {
          userId: newUser.id,
          employeeId: employee_code,
          email: newUser.email,
        },
      });
    } catch (error: any) {
      // Error validasi Zod
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // Unique violation Postgres (email / employee code duplikat)
      const pgCode = error?.code ?? error?.cause?.code;
      if (pgCode === "23505") {
        return res.status(409).json({
          success: false,
          message: "Data sudah terdaftar (email atau kode karyawan duplikat)",
        });
      }

      // Error lainnya
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat register",
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const loginValidation = loginSchema.parse(req.body);
      const { email, password } = loginValidation;

      const [tryLogin] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!tryLogin) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const rehashedPassword = await bcrypt.compare(
        password,
        tryLogin.password,
      );

      if (!rehashedPassword) {
        return res.status(404).json({
          success: false,
          message: "password atau email salah",
        });
      }

      const token = jwt.sign(
        {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1d",
        },
      );

      return res.status(200).json({
        success: true,
        message: "Berhasil login",
        userData: {
          userId: tryLogin.id,
          email: tryLogin.email,
          role: tryLogin.role,
          token: token,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  forgetPassword = async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      // Cari user berdasarkan email (tidak mengungkap apakah email terdaftar)
      const existingUser = await db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!existingUser.length) {
        // Return success message generik untuk menghindari user enumeration
        return res.status(200).json({
          success: true,
          message: "Jika email terdaftar, permintaan reset password telah dikirim",
        });
      }

      // // Generate token and hash
      // const token = generateToken();
      // const tokenHash = await bcrypt.hash(token, 10);
      // const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // Create pending reset request with token hash
      await db.insert(passwordResetRequests).values({
        userId: existingUser[0].id,
        status: "pending",
      });

      // Response generic - tidak mengirim token atau mengungkap status
      return res.status(200).json({
        success: true,
        message: "Jika email terdaftar, permintaan reset password telah dikirim",
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memproses permintaan",
      });
    }
  };

  // Reset password using token
  resetPasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      // Cari request berdasarkan token hash menggunakan bcrypt compare
      // Kita select semua request untuk user yang mungkin cocok, lalu compare hash di aplikasi
      const allRequests = await db
        .select()
        .from(passwordResetRequests)
        .limit(100);

      let foundRequest = null;
      for (const req of allRequests) {
        if (req.token && await bcrypt.compare(token, req.token)) {
          foundRequest = req;
          break;
        }
      }

      if (!foundRequest) {
        return res.status(400).json({
          success: false,
          message: "Token invalid atau tidak ditemukan",
        });
      }

      // Cek jika token sudah kedaluwarsa
      if (foundRequest.expiresAt && new Date(foundRequest.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Token telah kadaluwarsa",
        });
      }

      // Cek jika token sudah digunakan
      if (foundRequest.usedAt) {
        return res.status(400).json({
          success: false,
          message: "Token telah digunakan sebelumnya",
        });
      }

      // Update password user
      const [updatedUser] = await db
        .update(usersTable)
        .set({ password: await bcrypt.hash(newPassword, 10) })
        .where(eq(usersTable.id, foundRequest.userId))
        .returning({ id: usersTable.id });

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Gagal memperbarui password",
        });
      }

      // Tandai token sebagai digunakan
      await db
        .update(passwordResetRequests)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetRequests.id, foundRequest.id));

      return res.status(200).json({
        success: true,
        message: "Password berhasil diubah",
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mereset password",
      });
    }
  };
}

export default new Authentication();