import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
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
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

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
          userId: user.id,
          email: user.email,
          role: user.role,
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

  getAllEmployee = async (req: AuthRequest, res: Response) => {
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
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
        })
        .from(usersTable)
        
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
          userId: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan data",
      });
    }
  };
}

export default new EmployeeFeatures();
