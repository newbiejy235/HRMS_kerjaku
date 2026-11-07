import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
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
  payrollComponents,
  employeePayrollAllocations,
  payrollDetails,
  attendanceLocation,
} from "../../config/schema";
import { overtimeSchema } from "../../validation/overtime.validation";
import { AuthRequest } from "../../middleware/users.middleware";
import { permissionSchema } from "../../validation/permission.validation";
import QRCode from "qrcode";
import crypto from "node:crypto";
import { ZodError } from "zod";
import { calculateDistance } from "../../lib/location";
import { id } from "zod/locales";
// import TelegramService from "../../services/notification.service";
 
// const escapeHtml = (s: string) =>
//   s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");


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
          id: 1,
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
          usersTable
        },
      });
    } catch (error) {
      console.error("Generate QR Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat QR Code",
        alert: 'Gagal Buat Qr Code' 
      });
    }
  };

  attendance = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { token, latitude, longitude } = req.body;

      // 1. Validasi user
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // 2. Validasi token QR
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          message: "Token QR wajib dikirim",
        });
      }

      // 3. Validasi koordinat GPS karyawan
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Koordinat GPS tidak valid",
        });
      }

      // 4. Hash token QR
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const [validQr] = await db
        .select()
        .from(attendanceQrCode)
        .where(
          and(
            eq(attendanceQrCode.qrCodeToken, tokenHash),
            gt(attendanceQrCode.expiredAt, new Date()),
          ),
        )
        .limit(1);

      if (!validQr) {
        return res.status(404).json({
          success: false,
          message: "QR Code tidak valid atau sudah kedaluwarsa",
        });
      }

      // 5. Ambil data karyawan
      const [user] = await db
        .select({
          employeeId: employes.employeeId,
          employmentStatus: employes.employment_status,
        })
        .from(employes)
        .where(eq(employes.userId, userId))
        .limit(1);

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

      // 6. Ambil koordinat lokasi toko
      const [companyLocation] = await db
        .select({
          latitude: attendanceLocation.latitude,
          longitude: attendanceLocation.longitude,
          radiusMeter: attendanceLocation.radiusMeter,
        })
        .from(attendanceLocation)
        .where(eq(attendanceLocation.isActive, true))
        .limit(1);

      if (!companyLocation) {
        return res.status(404).json({
          success: false,
          message: "Lokasi toko belum dikonfigurasi",
        });
      }

      // 7. Hitung jarak karyawan dengan lokasi toko
      const distance = calculateDistance(
        latitude,
        longitude,
        companyLocation.latitude,
        companyLocation.longitude,
      );

      // 8. Validasi radius lokasi
      if (distance > companyLocation.radiusMeter) {
        return res.status(403).json({
          success: false,
          message:
            "Absensi ditolak. Anda berada di luar jangkauan lokasi toko.",
          data: {
            employeeDistance: Math.round(distance),
            allowedRadius: companyLocation.radiusMeter,
            latitude,
            longitude,
          },
        });
      }

      // 9. Format koordinat karyawan untuk disimpan
      const employeeLocate = `longtitude: ${longitude}, latitude: ${latitude}`;

      // 10. Ambil tanggal dan waktu Jakarta
      const now = new Date();

      const shiftDate = now.toLocaleDateString("sv-SE", {
        timeZone: "Asia/Jakarta",
      });

      const currentTime = now.toLocaleTimeString("sv-SE", {
        timeZone: "Asia/Jakarta",
        hour12: false,
      });

      // 11. Ambil jadwal shift karyawan hari ini
      const [schedule] = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
          normalTimeIn: attendanceSettings.normal_time_in,
          normalTimeOut: attendanceSettings.normal_time_out,
          toleranceTime: attendanceSettings.tolerance_time,
        })
        .from(shiftSchedule)
        .innerJoin(
          attendanceSettings,
          eq(shiftSchedule.shiftTime, attendanceSettings.id_settings),
        )
        .where(
          and(
            eq(shiftSchedule.id_employee, user.employeeId),
            eq(shiftSchedule.shiftDate, shiftDate),
          ),
        )
        .limit(1);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Jadwal shift hari ini tidak ditemukan",
        });
      }

      // 12. Validasi konfigurasi jam masuk
      if (!schedule.normalTimeIn || !schedule.toleranceTime) {
        return res.status(400).json({
          success: false,
          message: "Pengaturan jam masuk atau toleransi belum dikonfigurasi",
        });
      }

      // 13. Cek absensi karyawan hari ini
      const [existing] = await db
        .select()
        .from(employeeAttendance)
        .where(
          and(
            eq(employeeAttendance.id_employee, user.employeeId),
            eq(employeeAttendance.shiftDate, shiftDate),
          ),
        )
        .limit(1);

      // 14. Jika belum ada absensi, lakukan check-in
      if (!existing) {
        let attendanceStatus: "on time" | "tolerance time" | "late";

        if (currentTime <= schedule.normalTimeIn) {
          attendanceStatus = "on time";
        } else if (currentTime < schedule.toleranceTime) {
          attendanceStatus = "tolerance time";
        } else {
          attendanceStatus = "late";
        }

        const [newAttendance] = await db
          .insert(employeeAttendance)
          .values({
            shiftDate,
            employeeIn: currentTime,
            id_employee: user.employeeId,
            status: attendanceStatus,
            employeeLocate,
          })
          .returning();

        return res.status(201).json({
          success: true,
          message: "Berhasil melakukan absensi kehadiran",
          data: {
            employeeId: user.employeeId,
            date: shiftDate,
            checkIn: currentTime,
            status: attendanceStatus,
            employeeLocate,
            distance: Math.round(distance),
            allowedRadius: companyLocation.radiusMeter,
          },
        });
      }

      // 15. Jika sudah check-out, tolak absensi berikutnya
      if (existing.employeeOut) {
        return res.status(409).json({
          success: false,
          message: "Kamu sudah absen pulang hari ini",
        });
      }

      // 16. Lakukan check-out
      const [updatedAttendance] = await db
        .update(employeeAttendance)
        .set({
          employeeOut: currentTime,
          employeeLocate,
        })
        .where(eq(employeeAttendance.shiftId, existing.shiftId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Berhasil melakukan absensi pulang",
        data: {
          employeeId: user.employeeId,
          date: shiftDate,
          checkIn: existing.employeeIn,
          checkOut: currentTime,
          status: existing.status,
          employeeLocate,
          distance: Math.round(distance),
          allowedRadius: companyLocation.radiusMeter,
        },
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

      // // data karyawan yang mengajukan (buat nama di notif)
      // const [data] = await db
      //   .select({
      //     firstName: employes.firstName,
      //     lastName: employes.lastName,
      //   })
      //   .from(employes)
      //   .where(eq(employes.employeeId, userAccount.employee_code));

      // // semua HR yang sudah aktifin bot telegram
      // const hrList = await db
      //   .select({ telegramChatId: employes.telegramChatId })
      //   .from(usersTable)
      //   .innerJoin(employes, eq(employes.userId, usersTable.id))
      //   .where(
      //     and(eq(usersTable.role, "HR"), isNotNull(employes.telegramChatId)),
      //   );

      // const message = [
      //   "<b>Pengajuan lembur baru</b>",
      //   "",
      //   `Karyawan: ${escapeHtml(`${data.firstName} ${data.lastName ?? ""}`.trim())} (${userAccount.employee_code})`,
      //   `📆 Tanggal: ${overtimeDate}`,
      //   `⏱️ Total lembur: ${overtimeTotal}`,
      //   `📝 Keterangan: ${escapeHtml(description ?? "-")}`,
      //   "",
      //   "Silakan direspons di sistem.",
      // ].join("\n");

      // await Promise.allSettled(
      //   hrList.map((hr) =>
      //     TelegramService.sendMessage(hr.telegramChatId!, message),
      //   ),
      // );

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

  mySlip = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      console.log(user.userId);
      const [userAccount] = await db
        .select()
        .from(employes)
        .where(eq(employes.userId, user.userId))
        .limit(1);

      console.log(userAccount);

      // Ambil payroll berdasarkan ID
      const [payrollData] = await db
        .select({
          payrollId: payrolls.payrollId,
          employeeId: payrolls.employeeId,
          payrollPeriod: payrolls.payrollPeriod,
          totalEarnings: payrolls.totalEarnings,
          totalDeductions: payrolls.totalDeductions,
          netSalary: payrolls.netSalary,
          userId: employes.userId,
        })
        .from(payrolls)
        .innerJoin(employes, eq(payrolls.employeeId, employes.employeeId))
        .where(eq(payrolls.employeeId, userAccount.employeeId))
        .limit(1);

      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: "Data payroll tidak ditemukan",
        });
      }

      // HR dan Finance boleh melihat semua payroll.
      // Karyawan hanya boleh melihat payroll miliknya sendiri.
      if (
        user.role !== "HR" &&
        user.role !== "Finance" &&
        payrollData.userId !== user.userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat slip gaji ini",
        });
      }

      // Ambil detail komponen payroll
      const details = await db
        .select({
          detailId: payrollDetails.detailId,
          componentId: payrollDetails.componentId,
          componentName: payrollDetails.componentName,
          type: payrollDetails.type,
          amount: payrollDetails.amount,
        })
        .from(payrollDetails)
        .where(eq(payrollDetails.payrollId, payrollData.payrollId));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil slip gaji",
        data: {
          payroll: {
            payrollId: payrollData.payrollId,
            employeeId: payrollData.employeeId,
            payrollPeriod: payrollData.payrollPeriod,
            totalEarnings: payrollData.totalEarnings,
            totalDeductions: payrollData.totalDeductions,
            netSalary: payrollData.netSalary,
          },
          details: {
            earnings: details.filter((item) => item.type === "earning"),
            deductions: details.filter((item) => item.type === "deduction"),
          },
        },
      });
    } catch (error) {
      console.error("Error in getPayrollDetailsById:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };
}

export default new EmployeeFeatures();

