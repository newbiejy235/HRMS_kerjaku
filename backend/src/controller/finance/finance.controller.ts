import { Response } from "express";
import { eq, and, sql, asc, desc } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../middleware/users.middleware";
import { payrollSchema } from "../../validation/finance.validation";
import {
  employeePayrollAllocations,
  employes,
  payrollComponents,
  payrollDetails,
  payrolls,
} from "../../config/schema";
import { fromCents, toCents } from "../../lib/utils";

export class FinanceController {
  generatePayroll = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // Sesuaikan role ini dengan kebijakan akses payroll Kerjaku.
      if (user.role !== "HR" && user.role !== "Finance") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      // 1. Validasi request
      const validation = payrollSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { employeeId, payrollPeriod } = validation.data;

      // 2. Cek apakah payroll periode tersebut sudah pernah dibuat
      const [existingPayroll] = await db
        .select()
        .from(payrolls)
        .where(
          and(
            eq(payrolls.employeeId, employeeId),
            eq(payrolls.payrollPeriod, payrollPeriod),
          ),
        )
        .limit(1);

      if (existingPayroll) {
        return res.status(409).json({
          success: false,
          message: "Payroll karyawan untuk periode ini sudah dibuat",
        });
      }

      // 3. Ambil seluruh allocation beserta informasi komponennya
      const allocations = await db
        .select({
          componentId: employeePayrollAllocations.componentId,
          componentName: payrollComponents.componentName,
          type: payrollComponents.type,
          amount: employeePayrollAllocations.amount,
        })
        .from(employeePayrollAllocations)
        .innerJoin(
          payrollComponents,
          eq(employeePayrollAllocations.componentId, payrollComponents.id),
        )
        .where(eq(employeePayrollAllocations.employeeId, employeeId));

      if (allocations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Karyawan belum memiliki alokasi payroll",
        });
      }

      // 4. Hitung total earning dan deduction
      let totalEarnings = 0n;
      let totalDeductions = 0n;

      for (const allocation of allocations) {
        const amount = toCents(allocation.amount);

        if (allocation.type === "earning") {
          totalEarnings += amount;
        } else if (allocation.type === "deduction") {
          totalDeductions += amount;
        }
      }

      // 5. Hitung gaji bersih
      const netSalary = totalEarnings - totalDeductions;

      if (netSalary < 0n) {
        return res.status(400).json({
          success: false,
          message: "Total potongan melebihi total pendapatan",
        });
      }

      // 6. Simpan payroll dan detail dalam satu transaksi
      // 1. Query insert payroll
      const insertPayrollQuery = db
        .insert(payrolls)
        .values({
          employeeId,
          payrollPeriod,
          totalEarnings: fromCents(totalEarnings),
          totalDeductions: fromCents(totalDeductions),
          netSalary: fromCents(netSalary),
        })
        .returning();

      // 2. Subquery untuk mendapatkan payrollId
      const payrollIdQuery = db
        .select({
          payrollId: payrolls.payrollId,
        })
        .from(payrolls)
        .where(
          and(
            eq(payrolls.employeeId, employeeId),
            eq(payrolls.payrollPeriod, payrollPeriod),
          ),
        )
        .limit(1);

      // 3. Siapkan detail payroll
      const detailValues = allocations.map((allocation) => ({
        payrollId: sql`(${payrollIdQuery})`,
        componentId: allocation.componentId,
        componentName: allocation.componentName,
        type: allocation.type,
        amount: allocation.amount,
      }));

      // 4. Insert payroll dan detail menggunakan batch
      const [payrollResult, detailResult] = await db.batch([
        insertPayrollQuery,
        db.insert(payrollDetails).values(detailValues).returning(),
      ]);

      return res.status(201).json({
        success: true,
        message: "Payroll berhasil dibuat",
        data: {
          payroll: payrollResult[0],
          details: detailResult,
        },
      });
    } catch (error) {
      console.error("Error in generatePayroll:", error);

      const dbError = error as {
        code?: string;
        cause?: {
          code?: string;
        };
      };

      // Menangani kemungkinan request bersamaan untuk payroll yang sama
      if (dbError.code === "23505" || dbError.cause?.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Payroll untuk karyawan dan periode ini sudah dibuat",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getAllPayrollDetails = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR" && user.role !== "Finance") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const details = await db
        .select({
          detailId: payrollDetails.detailId,
          payrollId: payrollDetails.payrollId,
          employeeId: payrolls.employeeId,
          payrollPeriod: payrolls.payrollPeriod,
          componentId: payrollDetails.componentId,
          componentName: payrollDetails.componentName,
          type: payrollDetails.type,
          amount: payrollDetails.amount,
        })
        .from(payrollDetails)
        .innerJoin(payrolls, eq(payrollDetails.payrollId, payrolls.payrollId))
        .orderBy(desc(payrolls.payrollPeriod), payrollDetails.detailId);

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil seluruh detail payroll",
        total: details.length,
        data: details,
      });
    } catch (error) {
      console.error("Error in getAllPayrollDetails:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getAllPayrolls = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR" && user.role !== "Finance") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const payrollData = await db
        .select({
          payrollId: payrolls.payrollId,
          employeeId: payrolls.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          payrollPeriod: payrolls.payrollPeriod,
          totalEarnings: payrolls.totalEarnings,
          totalDeductions: payrolls.totalDeductions,
          netSalary: payrolls.netSalary,
        })
        .from(payrolls)
        .innerJoin(employes, eq(payrolls.employeeId, employes.employeeId))
        .orderBy(desc(payrolls.payrollPeriod), desc(payrolls.payrollId));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil seluruh data slip gaji",
        total: payrollData.length,
        data: payrollData,
      });
    } catch (error) {
      console.error("Error in getAllPayrolls:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };
}

export default new FinanceController();
