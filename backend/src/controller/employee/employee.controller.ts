import { and, desc, eq, gt } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../../config/db";
import {
  attendanceSettings,
  employes,
  shiftSchedule,
  usersTable,
  attendanceQrCode,
  employeeAttendance,
  employeePermission,
  overtime,
  payrolls,
  payrollDetails,
  payrollComponents,
  employeePayrollAllocations,
} from "../../config/schema";
import { overtimeSchema } from "../../validation/overtime.validation";
import { AuthRequest } from "../../middleware/users.middleware";
import { permissionSchema } from "../../validation/permission.validation";
import QRCode from "qrcode";
import crypto from "node:crypto";
import { ZodError } from "zod";

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

  generateAttendanceQr = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // 1. Generate token random
      const token = crypto.randomBytes(32).toString("hex");

      // 2. Hash token untuk disimpan di database
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // 3. Tentukan waktu expired (30 detik)
      const expiresAt = new Date(Date.now() + 60 * 1000);

      // 4. Generate QR Code
      const qrCode = await QRCode.toDataURL(
        JSON.stringify({
          type: "KERJAKU_ATTENDANCE",
          token: token,
        }),
      );

      // 5. Insert atau update token berdasarkan outlet
      // await db
      //   .insert(attendanceQrCode)
      //   .values({
      //     qrCodeToken: tokenHash,
      //     expiredAt: expiresAt,
      //   })

      await db.update(attendanceQrCode).set({
        qrCodeToken: tokenHash,
        expiredAt: expiresAt,
      });

      // 6. Kirim QR Code ke frontend
      return res.status(200).json({
        success: true,
        message: "QR Code berhasil dibuat",
        data: {
          qrCode,
          token,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Generate QR Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat QR Code",
      });
    }
  };

  attendance = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { token } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          message: "Token QR wajib dikirim",
        });
      }

      // Hash token dari hasil scan
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const [tryToPresent] = await db
        .select()
        .from(attendanceQrCode)
        .where(
          and(
            eq(attendanceQrCode.qrCodeToken, tokenHash),
            gt(attendanceQrCode.expiredAt, new Date()),
          ),
        );

      if (!tryToPresent) {
        return res.status(404).json({
          success: false,
          message: "qr tidak valid",
        });
      }

      const [user] = await db
        .select({
          employeeId: employes.employeeId,
          employmentStatus: employes.employment_status,
        })
        .from(employes)
        .where(eq(employes.userId, userId));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      if (user.employmentStatus !== "active") {
        return res.status(403).json({
          success: false,
          message: "Karyawan tidak aktif",
        });
      }

      // Satu timezone untuk tanggal & jam
      const now = new Date();
      const shiftDate = now.toLocaleDateString("sv-SE", {
        timeZone: "Asia/Jakarta",
      }); // YYYY-MM-DD
      const currentTime = now.toLocaleTimeString("sv-SE", {
        timeZone: "Asia/Jakarta",
      }); // HH:MM:SS

      // Cek dulu, baru insert/update
      const [existing] = await db
        .select()
        .from(employeeAttendance)
        .where(
          and(
            eq(employeeAttendance.id_employee, user.employeeId),
            eq(employeeAttendance.shiftDate, shiftDate),
          ),
        );

      if (!existing) {
        await db.insert(employeeAttendance).values({
          shiftDate,
          employeeIn: currentTime,
          id_employee: user.employeeId,
        });

        return res.status(200).json({
          success: true,
          message: "Berhasil melakukan absensi kehadiran",
        });
      }

      if (existing.employeeOut) {
        return res.status(409).json({
          success: false,
          message: "Kamu sudah absen pulang hari ini",
        });
      }

      await db
        .update(employeeAttendance)
        .set({ employeeOut: currentTime })
        .where(eq(employeeAttendance.shiftId, existing.shiftId));

      return res.status(200).json({
        success: true,
        message: "Berhasil melakukan absensi pulang",
      });
    } catch (error) {
      console.error("Scan Attendance Error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  };

  // employee request permission
  employeePermission = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user?.userId;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      const [userAccount] = await db
        .select({ employee_code: employes.employeeId })
        .from(employes)
        .where(eq(employes.userId, user));

      if (!userAccount) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      const validation = permissionSchema.parse(req.body);

      const { start_date, end_date, permit_type, permit_reason } = validation;

      const insertPermission = await db
        .insert(employeePermission)
        .values({
          id_employee: userAccount.employee_code,
          start_date,
          end_date,
          permit_type,
          permit_reason,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Pengajuan izin berhasil dibuat",
        data: insertPermission[0],
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  employeeOvertime = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user?.userId;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      const [userAccount] = await db
        .select({ employee_code: employes.employeeId })
        .from(employes)
        .where(eq(employes.userId, user));

      if (!userAccount) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      const validation = overtimeSchema.parse(req.body);

      const { overtimeDate, overtimeTotal, description } = validation;

      const insertOvertime = await db
        .insert(overtime)
        .values({
          id_employee: userAccount.employee_code,
          overtimeDate: new Date(overtimeDate),
          overtimeTotal: overtimeTotal,
          description: description,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Pengajuan lembur berhasil dibuat",
        data: insertOvertime[0],
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getMyPayslips = async (req: AuthRequest, res: Response) => {
    try {
      // 1. Validasi JWT
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Token tidak valid atau sesi telah berakhir",
        });
      }

      // 2. Validasi periode
      const period = req.query.period;

      if (
        period !== undefined &&
        (typeof period !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
      ) {
        return res.status(400).json({
          success: false,
          message: "Format periode harus YYYY-MM",
        });
      }

      // 3. Ambil employee berdasarkan userId JWT
      const [employee] = await db
        .select({
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          nip: employes.nip,
        })
        .from(employes)
        .where(eq(employes.userId, user.userId))
        .limit(1);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      // 4. Kondisi payroll
      const conditions = [
        eq(payrolls.employeeId, employee.employeeId),
        eq(payrolls.status, "accepted"),
      ];

      if (typeof period === "string") {
        conditions.push(eq(payrolls.payrollPeriod, period));
      }

      // 5. JOIN payroll + alokasi + komponen
      const payrollData = await db
        .select({
          payrollId: payrolls.payrollId,
          payrollPeriod: payrolls.payrollPeriod,
          totalEarnings: payrolls.totalEarnings,
          totalDeductions: payrolls.totalDeductions,
          netSalary: payrolls.netSalary,
          status: payrolls.status,
          reviewBy: payrolls.review_by,

          allocationId: employeePayrollAllocations.allocationId,
          componentId: payrollComponents.id,
          componentName: payrollComponents.componentName,
          componentDescription: payrollComponents.description,
          allocationAmount: employeePayrollAllocations.amount,
        })
        .from(payrolls)
        .leftJoin(
          employeePayrollAllocations,
          eq(payrolls.employeeId, employeePayrollAllocations.employeeId),
        )
        .leftJoin(
          payrollComponents,
          eq(employeePayrollAllocations.componentId, payrollComponents.id),
        )
        .where(and(...conditions))
        .orderBy(desc(payrolls.payrollPeriod));

      // 6. Validasi data payroll
      if (payrollData.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            typeof period === "string"
              ? `Slip gaji periode ${period} tidak ditemukan`
              : "Belum ada slip gaji yang disetujui",
        });
      }

      // 7. Kelompokkan hasil berdasarkan payrollId
      const groupedPayroll = new Map<
        number,
        {
          payrollId: number;
          payrollPeriod: string;
          totalEarnings: string;
          totalDeductions: string;
          netSalary: string;
          status: string;
          reviewBy: number | null;
          components: {
            allocationId: number;
            componentId: number;
            componentName: string;
            description: string | null;
            amount: string;
          }[];
        }
      >();

      for (const row of payrollData) {
        if (!groupedPayroll.has(row.payrollId)) {
          groupedPayroll.set(row.payrollId, {
            payrollId: row.payrollId,
            payrollPeriod: row.payrollPeriod,
            totalEarnings: row.totalEarnings,
            totalDeductions: row.totalDeductions,
            netSalary: row.netSalary,
            status: row.status,
            reviewBy: row.reviewBy,
            components: [],
          });
        }

        if (
          row.allocationId !== null &&
          row.componentId !== null &&
          row.componentName !== null &&
          row.allocationAmount !== null
        ) {
          groupedPayroll.get(row.payrollId)!.components.push({
            allocationId: row.allocationId,
            componentId: row.componentId,
            componentName: row.componentName,
            description: row.componentDescription,
            amount: row.allocationAmount,
          });
        }
      }

      // 8. Response
      return res.status(200).json({
        success: true,
        message: "Slip gaji berhasil ditemukan",
        data: {
          employee,
          totalSlips: groupedPayroll.size,
          payslips: Array.from(groupedPayroll.values()),
        },
      });
    } catch (error) {
      console.error("Get My Payslips Error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil slip gaji",
      });
    }
  };
}

export default new EmployeeFeatures();
