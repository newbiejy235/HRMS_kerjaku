import { db } from "../config/db";
import { Request, Response } from "express";
import { usersTable, employes, cities } from "../config/schema";
import { employe } from "../validation/employe.validation";
import { registerSchema } from "../validation/auth.validation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

export class Authentication {
  register = async (req: Request, res: Response) => {
    try {
      let angkaSebelumnya: number | null = null;

      function generateAngka(): number {
        let angkaBaru: number;

        do {
          angkaBaru = Math.floor(10000 + Math.random() * 90000);
        } while (angkaBaru === angkaSebelumnya);

        angkaSebelumnya = angkaBaru;

        return angkaBaru;
      }

      // Ambil hasil generate di luar function
      const hasil = generateAngka();
      const employee_code = `emp-${hasil}`

      console.log(hasil);

      // 1. Validasi data karyawan
      const employeeData = employe
        .omit({ userId: true, employeeId: true })
        .parse(req.body);

      // 2. Validasi email dan password
      const accountData = registerSchema.parse(req.body);

      const { email, password } = accountData;

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

      // 4. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 5. Buat akun user
      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: email,
          password: hashedPassword,
        })
        .returning();

      // 6. Buat data karyawan - cek foreign key terlebih dahulu
      const cityExists = await db
        .select()
        .from(cities)
        .where(eq(cities.id, cities));
      
      const positionExists = await db
        .select()
        .from(position)
        .where(eq(position.id_position, idPosition));
      
      const departmentExists = await db
        .select()
        .from(department)
        .where(eq(department.id_department, idDepartment));
      
      if (cityExists.length === 0 || positionExists.length === 0 || departmentExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Kota, posisi, atau department tidak ditemukan",
        });
      }
      
      await db.insert(employes).values({
        ...employeeData,
        userId: newUser.id,
        employeeId: employee_code,
      });

      // 7. Kirim respons berhasil
      return res.status(201).json({
        success: true,
        message: "Akun dan data karyawan berhasil dibuat",
        data: {
          userId: newUser.id,
          employeeId: employee_code ,
          email: newUser.email,
        },
      });
    } catch (error) {
      // 8. Tangani error validasi Zod
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

      // 9. Tangani error lainnya
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat register",
      });
    }
  };
}

export default new Authentication();
