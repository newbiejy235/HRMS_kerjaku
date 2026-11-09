import { Response } from "express";
import { AuthRequest } from "../../middleware/users.middleware";

import { db } from "../../config/db";
import {
  employeePermission,
  overtime,
  employeeReimbursements,
  passwordResetRequests,
  usersTable,
  employes,
} from "../../config/schema";

import { desc, eq, or } from "drizzle-orm";

export class GetNotificationController {
  getPermissionNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses notifikasi",
        });
      }

      const data = await db
        .select({
          id: employeePermission.id_permission,
          employeeCode: employeePermission.id_employee,
          date: employeePermission.start_date,
          status: employeePermission.status,
        })
        .from(employeePermission)
        .where(
          or(
            eq(employeePermission.status, "pending"),
            eq(employeePermission.status, "accepted"),
          ),
        )
        .orderBy(desc(employeePermission.createdAt));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data notifikasi izin",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get permission notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data notifikasi izin",
      });
    }
  };

  getOvertimeNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses notifikasi",
        });
      }

      const data = await db
        .select({
          id: overtime.id_overwork,
          employeeCode: overtime.id_employee,
          date: overtime.overtimeDate,
          status: overtime.status,
        })
        .from(overtime)
        .where(
          or(
            eq(overtime.status, "pending"),
            eq(overtime.status, "accepted"),
          ),
        )
        .orderBy(desc(overtime.overtimeDate));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data notifikasi lembur",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get overtime notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data notifikasi lembur",
      });
    }
  };

  getReimbursementNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses notifikasi",
        });
      }

      const data = await db
        .select({
          id: employeeReimbursements.id,
          employeeCode: employeeReimbursements.employeeId,
          date: employeeReimbursements.expenseDate,
          status: employeeReimbursements.status,
        })
        .from(employeeReimbursements)
        .where(
          or(
            eq(employeeReimbursements.status, "pending"),
            eq(employeeReimbursements.status, "approved"),
          ),
        )
        .orderBy(desc(employeeReimbursements.createdAt));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data notifikasi reimburse",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get reimbursement notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data notifikasi reimburse",
      });
    }
  };

  getResetPasswordNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses notifikasi",
        });
      }

      const data = await db
        .select({
          id: passwordResetRequests.id,
          employeeCode: employes.employeeId,
          date: passwordResetRequests.createdAt,
          status: passwordResetRequests.status,
        })
        .from(passwordResetRequests)
        .innerJoin(usersTable, eq(passwordResetRequests.userId, usersTable.id))
        .innerJoin(employes, eq(employes.userId, usersTable.id))
        .where(
          or(
            eq(passwordResetRequests.status, "pending"),
            eq(passwordResetRequests.status, "approved"),
          ),
        )
        .orderBy(desc(passwordResetRequests.createdAt));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data notifikasi reset password",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get reset password notification error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data notifikasi reset password",
      });
    }
  };
}

export default new GetNotificationController();
