import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../../config/db";
import { employes, usersTable } from "../../config/schema";
import { AuthRequest } from "../../middleware/users.middleware";

export class EmployeeFeatures {
  employeeProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      const [user] = await db
        .select({
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          gender: employes.gender,
          noTelp: employes.noTelp,
          hireDate: employes.hire_date,
          employmentStatus: employes.employment_status,
          email: usersTable.email,
          role: usersTable.role,
        })
        .from(employes)
        .innerJoin(usersTable, eq(employes.userId, usersTable.id))
        .where(eq(usersTable.id, userId));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan data",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan data",
      });
    }
  };
}

export default new EmployeeFeatures();
