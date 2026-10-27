import { db } from "../config/db";
import { Request, Response } from "express";
import {
  usersTable,
  employes,
  cities,
  position,
  department,
} from "../config/schema";
import { employe } from "../validation/employe.validation";
import { registerSchema } from "../validation/auth.validation";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { ZodError } from "zod";

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
      const [cityExists, positionExists, departmentExists] =
        await Promise.all([
          db
            .select()
            .from(cities)
            .where(eq(cities.id, employeeData.cities_id)),
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

  login = async (req:Request, res:Response) => {
    
  }
}

export default new Authentication();
