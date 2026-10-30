import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../../config/db";
import {
  attendanceSettings,
  employes,
  shiftSchedule,
  usersTable,
} from "../../config/schema";
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

  myShiftSchedule = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // Karyawan hanya melihat jadwal miliknya sendiri,
      // employeeId dipetakan dari userId yang login
      const [employee] = await db
        .select({ employeeId: employes.employeeId })
        .from(employes)
        .where(eq(employes.userId, userId))
        .limit(1);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      const shiftSchedules = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
          employeeLocate: shiftSchedule.employeeLocate,
          category: attendanceSettings.category,
          normal_time_in: attendanceSettings.normal_time_in,
          normal_time_out: attendanceSettings.normal_time_out,
        })
        .from(shiftSchedule)
        .innerJoin(
          attendanceSettings,
          eq(shiftSchedule.shiftTime, attendanceSettings.id_settings),
        )
        .where(eq(shiftSchedule.id_employee, employee.employeeId))
        .orderBy(shiftSchedule.shiftDate);

      return res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan jadwal shift",
        data: shiftSchedules,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan jadwal shift",
      });
    }
  };
}

export default new EmployeeFeatures();
