// import { Response } from "express";
// import { eq, and, sql, asc, desc } from "drizzle-orm";
// import { db } from "../../config/db";
// import {
//   payrollComponents,
//   employeePayrollComponents,
//   employeePayrollAllocations,
//   payrolls,
//   payrollDetails,
//   employes,
//   usersTable,
// } from "../../config/schema";
// import { AuthRequest } from "../../middleware/users.middleware";
// import {
//   createPayrollComponentSchema,
//   createEmployeePayrollComponentSchema,
//   updateEmployeePayrollComponentSchema,
//   createPayrollAllocationSchema,
//   updatePayrollAllocationSchema,
//   createPayrollSchema,
//   createPayrollDetailSchema,
//   updatePayrollDetailSchema,
// } from "../../validation/finance.validation";
// import { ZodError } from "zod";

// export class FinanceController {
//   // Helper untuk verifikasi sesi dan otorisasi role Finance
//   private checkFinanceRole(req: AuthRequest, res: Response): boolean {
//     const user = req.user;
//     if (!user?.userId) {
//       res.status(401).json({
//         success: false,
//         message: "Sesi tidak valid, silakan login kembali",
//       });
//       return false;
//     }

//     if (user.role !== "Finance") {
//       res.status(403).json({
//         success: false,
//         message: "Akses ditolak: Hanya role Finance yang diizinkan mengakses fitur ini",
//       });
//       return false;
//     }

//     return true;
//   }

//   // Helper formatting Zod error response
//   private handleZodError(error: ZodError, res: Response) {
//     return res.status(400).json({
//       success: false,
//       message: "Validasi gagal",
//       errors: error.issues.map((issue) => ({
//         field: issue.path.join("."),
//         message: issue.message,
//       })),
//     });
//   }

//   // ==========================================
//   // A. PAYROLL COMPONENT (MASTER DATA)
//   // ==========================================

//   // GET /finance/components
//   getAllPayrollComponents = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const components = await db
//         .select()
//         .from(payrollComponents)
//         .orderBy(asc(payrollComponents.id));

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil seluruh data komponen payroll",
//         data: components,
//       });
//     } catch (error) {
//       console.error("Error in getAllPayrollComponents:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // POST /finance/components
//   createPayrollComponent = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const validated = createPayrollComponentSchema.parse(req.body);
//       const { componentName, description } = validated;

//       // Cegah duplikasi nama komponen (case-insensitive check)
//       const existing = await db
//         .select({ id: payrollComponents.id })
//         .from(payrollComponents)
//         .where(
//           sql`LOWER(${payrollComponents.componentName}) = LOWER(${componentName})`,
//         )
//         .limit(1);

//       if (existing.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Nama komponen payroll sudah digunakan",
//         });
//       }

//       const [newComponent] = await db
//         .insert(payrollComponents)
//         .values({
//           componentName,
//           description: description ?? null,
//         })
//         .returning();

//       return res.status(201).json({
//         success: true,
//         message: "Komponen payroll berhasil ditambahkan",
//         data: newComponent,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       const pgCode = error?.code ?? error?.cause?.code;
//       if (pgCode === "23505") {
//         return res.status(409).json({
//           success: false,
//           message: "Nama komponen payroll sudah terdaftar",
//         });
//       }
//       console.error("Error in createPayrollComponent:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // DELETE /finance/components/:id
//   deletePayrollComponent = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const id = Number(req.params.id);
//       if (!Number.isInteger(id) || id <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID komponen payroll tidak valid",
//         });
//       }

//       // Pastikan data yang akan dihapus memang tersedia
//       const [existing] = await db
//         .select()
//         .from(payrollComponents)
//         .where(eq(payrollComponents.id, id))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Komponen payroll tidak ditemukan",
//         });
//       }

//       // Cegah penghapusan jika data masih digunakan oleh relasi
//       // 1. Cek di employeePayrollComponents
//       const usedInEmpComponent = await db
//         .select({ id: employeePayrollComponents.id })
//         .from(employeePayrollComponents)
//         .where(eq(employeePayrollComponents.payrollComponentId, id))
//         .limit(1);

//       if (usedInEmpComponent.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Komponen payroll tidak dapat dihapus karena masih digunakan pada data komponen karyawan",
//         });
//       }

//       // 2. Cek di employeePayrollAllocations
//       const usedInAllocation = await db
//         .select({ allocationId: employeePayrollAllocations.allocationId })
//         .from(employeePayrollAllocations)
//         .where(eq(employeePayrollAllocations.componentId, id))
//         .limit(1);

//       if (usedInAllocation.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Komponen payroll tidak dapat dihapus karena masih digunakan pada alokasi payroll karyawan",
//         });
//       }

//       // 3. Cek di payrollDetails
//       const usedInPayrollDetails = await db
//         .select({ detailId: payrollDetails.detailId })
//         .from(payrollDetails)
//         .where(eq(payrollDetails.componentId, id))
//         .limit(1);

//       if (usedInPayrollDetails.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Komponen payroll tidak dapat dihapus karena masih digunakan pada transaksi detail payroll",
//         });
//       }

//       await db
//         .delete(payrollComponents)
//         .where(eq(payrollComponents.id, id));

//       return res.status(200).json({
//         success: true,
//         message: "Komponen payroll berhasil dihapus",
//       });
//     } catch (error) {
//       console.error("Error in deletePayrollComponent:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // ==========================================
//   // B. EMPLOYEE PAYROLL COMPONENT
//   // ==========================================

//   // GET /finance/employee-components
//   getAllEmployeePayrollComponents = async (
//     req: AuthRequest,
//     res: Response,
//   ) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const data = await db
//         .select({
//           id: employeePayrollComponents.id,
//           payrollComponentId: employeePayrollComponents.payrollComponentId,
//           componentName: payrollComponents.componentName,
//           amount: employeePayrollComponents.amount,
//           description: employeePayrollComponents.description,
//           createdAt: employeePayrollComponents.createdAt,
//         })
//         .from(employeePayrollComponents)
//         .innerJoin(
//           payrollComponents,
//           eq(
//             employeePayrollComponents.payrollComponentId,
//             payrollComponents.id,
//           ),
//         )
//         .orderBy(asc(employeePayrollComponents.id));

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil data employee payroll component",
//         data,
//       });
//     } catch (error) {
//       console.error("Error in getAllEmployeePayrollComponents:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // POST /finance/employee-components
//   createEmployeePayrollComponent = async (
//     req: AuthRequest,
//     res: Response,
//   ) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const validated = createEmployeePayrollComponentSchema.parse(req.body);
//       const { payrollComponentId, amount, description } = validated;

//       // Pastikan payroll component yang direferensikan tersedia
//       const [compExists] = await db
//         .select({ id: payrollComponents.id })
//         .from(payrollComponents)
//         .where(eq(payrollComponents.id, payrollComponentId))
//         .limit(1);

//       if (!compExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Komponen payroll yang direferensikan tidak ditemukan",
//         });
//       }

//       const [newRecord] = await db
//         .insert(employeePayrollComponents)
//         .values({
//           payrollComponentId,
//           amount,
//           description: description ?? null,
//         })
//         .returning();

//       return res.status(201).json({
//         success: true,
//         message: "Employee payroll component berhasil ditambahkan",
//         data: newRecord,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       console.error("Error in createEmployeePayrollComponent:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // PATCH /finance/employee-components/:id
//   updateEmployeePayrollComponent = async (
//     req: AuthRequest,
//     res: Response,
//   ) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const id = Number(req.params.id);
//       if (!Number.isInteger(id) || id <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID employee payroll component tidak valid",
//         });
//       }

//       const [existing] = await db
//         .select()
//         .from(employeePayrollComponents)
//         .where(eq(employeePayrollComponents.id, id))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Data employee payroll component tidak ditemukan",
//         });
//       }

//       const validated = updateEmployeePayrollComponentSchema.parse(req.body);

//       // Jika payrollComponentId diubah, pastikan id baru valid
//       if (validated.payrollComponentId !== undefined) {
//         const [compExists] = await db
//           .select({ id: payrollComponents.id })
//           .from(payrollComponents)
//           .where(eq(payrollComponents.id, validated.payrollComponentId))
//           .limit(1);

//         if (!compExists) {
//           return res.status(404).json({
//             success: false,
//             message: "Komponen payroll yang direferensikan tidak ditemukan",
//           });
//         }
//       }

//       const updateData: {
//         payrollComponentId?: number;
//         amount?: number;
//         description?: string | null;
//       } = {};

//       if (validated.payrollComponentId !== undefined) {
//         updateData.payrollComponentId = validated.payrollComponentId;
//       }
//       if (validated.amount !== undefined) {
//         updateData.amount = validated.amount;
//       }
//       if (validated.description !== undefined) {
//         updateData.description = validated.description;
//       }

//       const [updated] = await db
//         .update(employeePayrollComponents)
//         .set(updateData)
//         .where(eq(employeePayrollComponents.id, id))
//         .returning();

//       return res.status(200).json({
//         success: true,
//         message: "Employee payroll component berhasil diperbarui",
//         data: updated,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       console.error("Error in updateEmployeePayrollComponent:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // DELETE /finance/employee-components/:id
//   deleteEmployeePayrollComponent = async (
//     req: AuthRequest,
//     res: Response,
//   ) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const id = Number(req.params.id);
//       if (!Number.isInteger(id) || id <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID employee payroll component tidak valid",
//         });
//       }

//       const [existing] = await db
//         .select()
//         .from(employeePayrollComponents)
//         .where(eq(employeePayrollComponents.id, id))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Data employee payroll component tidak ditemukan",
//         });
//       }

//       await db
//         .delete(employeePayrollComponents)
//         .where(eq(employeePayrollComponents.id, id));

//       return res.status(200).json({
//         success: true,
//         message: "Employee payroll component berhasil dihapus",
//       });
//     } catch (error) {
//       console.error("Error in deleteEmployeePayrollComponent:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // ==========================================
//   // C. ALLOCATION PAYROLL
//   // ==========================================

//   // GET /finance/allocations
//   getAllPayrollAllocations = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const employeeId = req.query.employeeId as string | undefined;

//       const query = db
//         .select({
//           allocationId: employeePayrollAllocations.allocationId,
//           employeeId: employeePayrollAllocations.employeeId,
//           employeeName: sql<string>`CONCAT(${employes.firstName}, ' ', COALESCE(${employes.lastName}, ''))`,
//           componentId: employeePayrollAllocations.componentId,
//           componentName: payrollComponents.componentName,
//           amount: employeePayrollAllocations.amount,
//         })
//         .from(employeePayrollAllocations)
//         .innerJoin(
//           employes,
//           eq(employeePayrollAllocations.employeeId, employes.employeeId),
//         )
//         .innerJoin(
//           payrollComponents,
//           eq(employeePayrollAllocations.componentId, payrollComponents.id),
//         );

//       const allocations = employeeId
//         ? await query
//             .where(eq(employeePayrollAllocations.employeeId, employeeId))
//             .orderBy(asc(employeePayrollAllocations.allocationId))
//         : await query.orderBy(asc(employeePayrollAllocations.allocationId));

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil data alokasi payroll",
//         data: allocations,
//       });
//     } catch (error) {
//       console.error("Error in getAllPayrollAllocations:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // POST /finance/allocations
//   createPayrollAllocation = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const validated = createPayrollAllocationSchema.parse(req.body);
//       const { employeeId, componentId, amount } = validated;

//       // 1. Pastikan karyawan valid
//       const [empExists] = await db
//         .select({ employeeId: employes.employeeId })
//         .from(employes)
//         .where(eq(employes.employeeId, employeeId))
//         .limit(1);

//       if (!empExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Karyawan tidak ditemukan",
//         });
//       }

//       // 2. Pastikan komponen payroll valid
//       const [compExists] = await db
//         .select({ id: payrollComponents.id })
//         .from(payrollComponents)
//         .where(eq(payrollComponents.id, componentId))
//         .limit(1);

//       if (!compExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Komponen payroll tidak ditemukan",
//         });
//       }

//       // 3. Cegah duplikasi alokasi untuk kombinasi employee & component
//       const [duplicate] = await db
//         .select({ allocationId: employeePayrollAllocations.allocationId })
//         .from(employeePayrollAllocations)
//         .where(
//           and(
//             eq(employeePayrollAllocations.employeeId, employeeId),
//             eq(employeePayrollAllocations.componentId, componentId),
//           ),
//         )
//         .limit(1);

//       if (duplicate) {
//         return res.status(400).json({
//           success: false,
//           message: "Alokasi komponen ini sudah ada untuk karyawan tersebut",
//         });
//       }

//       const formattedAmount = Number(amount).toFixed(2);

//       const [newAllocation] = await db
//         .insert(employeePayrollAllocations)
//         .values({
//           employeeId,
//           componentId,
//           amount: formattedAmount,
//         })
//         .returning();

//       return res.status(201).json({
//         success: true,
//         message: "Alokasi payroll berhasil dibuat",
//         data: newAllocation,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       const pgCode = error?.code ?? error?.cause?.code;
//       if (pgCode === "23505") {
//         return res.status(409).json({
//           success: false,
//           message: "Alokasi komponen ini sudah ada untuk karyawan tersebut",
//         });
//       }
//       console.error("Error in createPayrollAllocation:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // PATCH /finance/allocations/:allocationId
//   updatePayrollAllocation = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const allocationId = Number(req.params.allocationId);
//       if (!Number.isInteger(allocationId) || allocationId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID alokasi payroll tidak valid",
//         });
//       }

//       const [existing] = await db
//         .select()
//         .from(employeePayrollAllocations)
//         .where(eq(employeePayrollAllocations.allocationId, allocationId))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Data alokasi payroll tidak ditemukan",
//         });
//       }

//       const validated = updatePayrollAllocationSchema.parse(req.body);

//       const targetEmployeeId = validated.employeeId ?? existing.employeeId;
//       const targetComponentId = validated.componentId ?? existing.componentId;

//       // Jika employeeId diubah, pastikan employee exists
//       if (validated.employeeId !== undefined) {
//         const [empExists] = await db
//           .select({ employeeId: employes.employeeId })
//           .from(employes)
//           .where(eq(employes.employeeId, validated.employeeId))
//           .limit(1);

//         if (!empExists) {
//           return res.status(404).json({
//             success: false,
//             message: "Karyawan tidak ditemukan",
//           });
//         }
//       }

//       // Jika componentId diubah, pastikan component exists
//       if (validated.componentId !== undefined) {
//         const [compExists] = await db
//           .select({ id: payrollComponents.id })
//           .from(payrollComponents)
//           .where(eq(payrollComponents.id, validated.componentId))
//           .limit(1);

//         if (!compExists) {
//           return res.status(404).json({
//             success: false,
//             message: "Komponen payroll tidak ditemukan",
//           });
//         }
//       }

//       // Cegah duplikasi jika employeeId atau componentId berubah
//       if (
//         targetEmployeeId !== existing.employeeId ||
//         targetComponentId !== existing.componentId
//       ) {
//         const [duplicate] = await db
//           .select({ allocationId: employeePayrollAllocations.allocationId })
//           .from(employeePayrollAllocations)
//           .where(
//             and(
//               eq(employeePayrollAllocations.employeeId, targetEmployeeId),
//               eq(employeePayrollAllocations.componentId, targetComponentId),
//             ),
//           )
//           .limit(1);

//         if (duplicate && duplicate.allocationId !== allocationId) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Alokasi untuk kombinasi karyawan dan komponen tersebut sudah ada",
//           });
//         }
//       }

//       const updateData: {
//         employeeId?: string;
//         componentId?: number;
//         amount?: string;
//       } = {};

//       if (validated.employeeId !== undefined) {
//         updateData.employeeId = validated.employeeId;
//       }
//       if (validated.componentId !== undefined) {
//         updateData.componentId = validated.componentId;
//       }
//       if (validated.amount !== undefined) {
//         updateData.amount = Number(validated.amount).toFixed(2);
//       }

//       const [updated] = await db
//         .update(employeePayrollAllocations)
//         .set(updateData)
//         .where(eq(employeePayrollAllocations.allocationId, allocationId))
//         .returning();

//       return res.status(200).json({
//         success: true,
//         message: "Alokasi payroll berhasil diperbarui",
//         data: updated,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       console.error("Error in updatePayrollAllocation:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // DELETE /finance/allocations/:allocationId
//   deletePayrollAllocation = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const allocationId = Number(req.params.allocationId);
//       if (!Number.isInteger(allocationId) || allocationId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID alokasi payroll tidak valid",
//         });
//       }

//       const [existing] = await db
//         .select()
//         .from(employeePayrollAllocations)
//         .where(eq(employeePayrollAllocations.allocationId, allocationId))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Data alokasi payroll tidak ditemukan",
//         });
//       }

//       await db
//         .delete(employeePayrollAllocations)
//         .where(eq(employeePayrollAllocations.allocationId, allocationId));

//       return res.status(200).json({
//         success: true,
//         message: "Alokasi payroll berhasil dihapus",
//       });
//     } catch (error) {
//       console.error("Error in deletePayrollAllocation:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // ==========================================
//   // D. PAYROLL & PAYROLL DETAILS
//   // ==========================================

//   // Helper untuk menghitung ulang totals pada table payrolls
//   private async recalculatePayrollTotals(payrollId: number) {
//     const details = await db
//       .select({
//         amount: payrollDetails.amount,
//         description: payrollDetails.description,
//       })
//       .from(payrollDetails)
//       .where(eq(payrollDetails.payrollId, payrollId));

//     let earnings = 0;
//     let deductions = 0;

//     for (const d of details) {
//       const amt = Number(d.amount) || 0;
//       if (d.description?.startsWith("[DEDUCTION]")) {
//         deductions += amt;
//       } else {
//         earnings += amt;
//       }
//     }

//     const net = earnings - deductions;

//     const [updatedPayroll] = await db
//       .update(payrolls)
//       .set({
//         totalEarnings: earnings.toFixed(2),
//         totalDeductions: deductions.toFixed(2),
//         netSalary: net.toFixed(2),
//       })
//       .where(eq(payrolls.payrollId, payrollId))
//       .returning();

//     return updatedPayroll;
//   }

//   // GET /finance/payrolls
//   getAllPayrolls = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const employeeId = req.query.employeeId as string | undefined;
//       const payrollPeriod = req.query.payrollPeriod as string | undefined;
//       const status = req.query.status as any;

//       const query = db
//         .select({
//           payrollId: payrolls.payrollId,
//           employeeId: payrolls.employeeId,
//           employeeName: sql<string>`CONCAT(${employes.firstName}, ' ', COALESCE(${employes.lastName}, ''))`,
//           payrollPeriod: payrolls.payrollPeriod,
//           totalEarnings: payrolls.totalEarnings,
//           totalDeductions: payrolls.totalDeductions,
//           netSalary: payrolls.netSalary,
//           status: payrolls.status,
//           reviewBy: payrolls.review_by,
//           reviewerEmail: usersTable.email,
//         })
//         .from(payrolls)
//         .innerJoin(employes, eq(payrolls.employeeId, employes.employeeId))
//         .leftJoin(usersTable, eq(payrolls.review_by, usersTable.id));

//       const conditions = [];
//       if (employeeId) conditions.push(eq(payrolls.employeeId, employeeId));
//       if (payrollPeriod)
//         conditions.push(eq(payrolls.payrollPeriod, payrollPeriod));
//       if (status) conditions.push(eq(payrolls.status, status));

//       const data =
//         conditions.length > 0
//           ? await query.where(and(...conditions)).orderBy(desc(payrolls.payrollId))
//           : await query.orderBy(desc(payrolls.payrollId));

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil data payroll",
//         data,
//       });
//     } catch (error) {
//       console.error("Error in getAllPayrolls:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // GET /finance/payrolls/:payrollId
//   getPayrollById = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const payrollId = Number(req.params.payrollId);
//       if (!Number.isInteger(payrollId) || payrollId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID payroll tidak valid",
//         });
//       }

//       const [payroll] = await db
//         .select({
//           payrollId: payrolls.payrollId,
//           employeeId: payrolls.employeeId,
//           employeeName: sql<string>`CONCAT(${employes.firstName}, ' ', COALESCE(${employes.lastName}, ''))`,
//           payrollPeriod: payrolls.payrollPeriod,
//           totalEarnings: payrolls.totalEarnings,
//           totalDeductions: payrolls.totalDeductions,
//           netSalary: payrolls.netSalary,
//           status: payrolls.status,
//           reviewBy: payrolls.review_by,
//           reviewerEmail: usersTable.email,
//         })
//         .from(payrolls)
//         .innerJoin(employes, eq(payrolls.employeeId, employes.employeeId))
//         .leftJoin(usersTable, eq(payrolls.review_by, usersTable.id))
//         .where(eq(payrolls.payrollId, payrollId))
//         .limit(1);

//       if (!payroll) {
//         return res.status(404).json({
//           success: false,
//           message: "Data payroll tidak ditemukan",
//         });
//       }

//       const rawDetails = await db
//         .select({
//           detailId: payrollDetails.detailId,
//           payrollId: payrollDetails.payrollId,
//           componentId: payrollDetails.componentId,
//           componentName: payrollComponents.componentName,
//           amount: payrollDetails.amount,
//           description: payrollDetails.description,
//         })
//         .from(payrollDetails)
//         .innerJoin(
//           payrollComponents,
//           eq(payrollDetails.componentId, payrollComponents.id),
//         )
//         .where(eq(payrollDetails.payrollId, payrollId))
//         .orderBy(asc(payrollDetails.detailId));

//       const details = rawDetails.map((d) => {
//         const isDeduction = d.description?.startsWith("[DEDUCTION]");
//         const cleanedDescription = d.description
//           ? d.description.replace(/^\[(DEDUCTION|EARNING)\]\s*/, "")
//           : null;
//         return {
//           ...d,
//           type: isDeduction ? "deduction" : "earning",
//           description: cleanedDescription,
//         };
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil detail data payroll",
//         data: {
//           payroll,
//           details,
//         },
//       });
//     } catch (error) {
//       console.error("Error in getPayrollById:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // POST /finance/payrolls
//   createPayroll = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const validated = createPayrollSchema.parse(req.body);
//       const { employeeId, payrollPeriod } = validated;

//       // 1. Pastikan karyawan terdaftar
//       const [empExists] = await db
//         .select({ employeeId: employes.employeeId })
//         .from(employes)
//         .where(eq(employes.employeeId, employeeId))
//         .limit(1);

//       if (!empExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Karyawan tidak ditemukan",
//         });
//       }

//       // 2. Cegah duplikasi payroll untuk karyawan pada periode yang sama
//       const [duplicate] = await db
//         .select({ payrollId: payrolls.payrollId })
//         .from(payrolls)
//         .where(
//           and(
//             eq(payrolls.employeeId, employeeId),
//             eq(payrolls.payrollPeriod, payrollPeriod),
//           ),
//         )
//         .limit(1);

//       if (duplicate) {
//         return res.status(409).json({
//           success: false,
//           message: "Payroll untuk karyawan pada periode tersebut sudah ada",
//         });
//       }

//       // 3. Buat draft payroll baru
//       // Nilai total dimulai dari 0 dan dihitung otomatis oleh backend saat detail ditambahkan
//       const [newPayroll] = await db
//         .insert(payrolls)
//         .values({
//           employeeId,
//           payrollPeriod,
//           totalEarnings: "0.00",
//           totalDeductions: "0.00",
//           netSalary: "0.00",
//           status: "pending",
//         })
//         .returning();

//       return res.status(201).json({
//         success: true,
//         message: "Draft payroll berhasil dibuat dengan status pending",
//         data: newPayroll,
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       const pgCode = error?.code ?? error?.cause?.code;
//       if (pgCode === "23505") {
//         return res.status(409).json({
//           success: false,
//           message: "Payroll untuk karyawan pada periode tersebut sudah ada",
//         });
//       }
//       console.error("Error in createPayroll:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // DELETE /finance/payrolls/:payrollId
//   deletePayroll = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const payrollId = Number(req.params.payrollId);
//       if (!Number.isInteger(payrollId) || payrollId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID payroll tidak valid",
//         });
//       }

//       const [existing] = await db
//         .select()
//         .from(payrolls)
//         .where(eq(payrolls.payrollId, payrollId))
//         .limit(1);

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Data payroll tidak ditemukan",
//         });
//       }

//       if (existing.status !== "pending") {
//         return res.status(400).json({
//           success: false,
//           message: "Hanya payroll berstatus pending yang dapat dihapus",
//         });
//       }

//       // Hapus seluruh detail terlebih dahulu, lalu hapus header payroll
//       await db
//         .delete(payrollDetails)
//         .where(eq(payrollDetails.payrollId, payrollId));

//       await db.delete(payrolls).where(eq(payrolls.payrollId, payrollId));

//       return res.status(200).json({
//         success: true,
//         message: "Data payroll beserta detailnya berhasil dihapus",
//       });
//     } catch (error) {
//       console.error("Error in deletePayroll:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // GET /finance/payroll-details
//   getAllPayrollDetails = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const payrollId = req.query.payrollId
//         ? Number(req.query.payrollId)
//         : undefined;

//       const query = db
//         .select({
//           detailId: payrollDetails.detailId,
//           payrollId: payrollDetails.payrollId,
//           componentId: payrollDetails.componentId,
//           componentName: payrollComponents.componentName,
//           amount: payrollDetails.amount,
//           description: payrollDetails.description,
//         })
//         .from(payrollDetails)
//         .innerJoin(
//           payrollComponents,
//           eq(payrollDetails.componentId, payrollComponents.id),
//         );

//       const rawData =
//         payrollId && Number.isInteger(payrollId)
//           ? await query
//               .where(eq(payrollDetails.payrollId, payrollId))
//               .orderBy(asc(payrollDetails.detailId))
//           : await query.orderBy(asc(payrollDetails.detailId));

//       const data = rawData.map((d) => {
//         const isDeduction = d.description?.startsWith("[DEDUCTION]");
//         const cleanedDescription = d.description
//           ? d.description.replace(/^\[(DEDUCTION|EARNING)\]\s*/, "")
//           : null;
//         return {
//           ...d,
//           type: isDeduction ? "deduction" : "earning",
//           description: cleanedDescription,
//         };
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Berhasil mengambil data detail payroll",
//         data,
//       });
//     } catch (error) {
//       console.error("Error in getAllPayrollDetails:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // POST /finance/payroll-details
//   createPayrollDetail = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const validated = createPayrollDetailSchema.parse(req.body);
//       const { payrollId, componentId, amount, type, description } = validated;

//       // 1. Cek payroll induk
//       const [parentPayroll] = await db
//         .select()
//         .from(payrolls)
//         .where(eq(payrolls.payrollId, payrollId))
//         .limit(1);

//       if (!parentPayroll) {
//         return res.status(404).json({
//           success: false,
//           message: "Data transaksi payroll induk tidak ditemukan",
//         });
//       }

//       if (parentPayroll.status !== "pending") {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Detail tidak dapat ditambahkan pada payroll yang sudah diproses oleh HR",
//         });
//       }

//       // 2. Cek komponen payroll
//       const [compExists] = await db
//         .select({ id: payrollComponents.id })
//         .from(payrollComponents)
//         .where(eq(payrollComponents.id, componentId))
//         .limit(1);

//       if (!compExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Komponen payroll tidak ditemukan",
//         });
//       }

//       // 3. Cegah duplikasi komponen yang sama pada payroll yang sama
//       const [duplicate] = await db
//         .select({ detailId: payrollDetails.detailId })
//         .from(payrollDetails)
//         .where(
//           and(
//             eq(payrollDetails.payrollId, payrollId),
//             eq(payrollDetails.componentId, componentId),
//           ),
//         )
//         .limit(1);

//       if (duplicate) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Komponen ini sudah ada pada payroll tersebut. Gunakan update untuk memperbarui nominal.",
//         });
//       }

//       const formattedAmount = Number(amount).toFixed(2);
//       const tag = type === "deduction" ? "[DEDUCTION]" : "[EARNING]";
//       const formattedDescription = description ? `${tag} ${description}` : tag;

//       // 4. Insert detail
//       const [newDetail] = await db
//         .insert(payrollDetails)
//         .values({
//           payrollId,
//           componentId,
//           amount: formattedAmount,
//           description: formattedDescription,
//         })
//         .returning();

//       // 5. Perhitungan konsisten di backend: hitung ulang total earnings, deductions, & net salary
//       const updatedPayroll = await this.recalculatePayrollTotals(payrollId);

//       return res.status(201).json({
//         success: true,
//         message:
//           "Detail payroll berhasil ditambahkan dan total nominal gaji telah dihitung ulang oleh sistem",
//         data: {
//           detail: {
//             ...newDetail,
//             type,
//             description: description ?? null,
//           },
//           payroll: updatedPayroll,
//         },
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       console.error("Error in createPayrollDetail:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // PATCH /finance/payroll-details/:detailId
//   updatePayrollDetail = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const detailId = Number(req.params.detailId);
//       if (!Number.isInteger(detailId) || detailId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID detail payroll tidak valid",
//         });
//       }

//       const [existingDetail] = await db
//         .select()
//         .from(payrollDetails)
//         .where(eq(payrollDetails.detailId, detailId))
//         .limit(1);

//       if (!existingDetail) {
//         return res.status(404).json({
//           success: false,
//           message: "Data detail payroll tidak ditemukan",
//         });
//       }

//       // Cek status payroll induk
//       const [parentPayroll] = await db
//         .select()
//         .from(payrolls)
//         .where(eq(payrolls.payrollId, existingDetail.payrollId))
//         .limit(1);

//       if (!parentPayroll || parentPayroll.status !== "pending") {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Detail payroll tidak dapat diubah karena payroll sudah diproses oleh HR",
//         });
//       }

//       const validated = updatePayrollDetailSchema.parse(req.body);

//       // Jika componentId diubah
//       if (validated.componentId !== undefined) {
//         const [compExists] = await db
//           .select({ id: payrollComponents.id })
//           .from(payrollComponents)
//           .where(eq(payrollComponents.id, validated.componentId))
//           .limit(1);

//         if (!compExists) {
//           return res.status(404).json({
//             success: false,
//             message: "Komponen payroll tidak ditemukan",
//           });
//         }

//         // Cek duplikasi di detail payroll yang sama
//         if (validated.componentId !== existingDetail.componentId) {
//           const [duplicate] = await db
//             .select({ detailId: payrollDetails.detailId })
//             .from(payrollDetails)
//             .where(
//               and(
//                 eq(payrollDetails.payrollId, existingDetail.payrollId),
//                 eq(payrollDetails.componentId, validated.componentId),
//               ),
//             )
//             .limit(1);

//           if (duplicate && duplicate.detailId !== detailId) {
//             return res.status(400).json({
//               success: false,
//               message:
//                 "Komponen payroll tersebut sudah ada pada transaksi payroll ini",
//             });
//           }
//         }
//       }

//       // Tentukan tipe baru atau gunakan tipe lama
//       const existingIsDeduction =
//         existingDetail.description?.startsWith("[DEDUCTION]");
//       const targetType =
//         validated.type ?? (existingIsDeduction ? "deduction" : "earning");
//       const targetDesc =
//         validated.description !== undefined
//           ? validated.description
//           : existingDetail.description
//             ? existingDetail.description.replace(/^\[(DEDUCTION|EARNING)\]\s*/, "")
//             : null;

//       const tag = targetType === "deduction" ? "[DEDUCTION]" : "[EARNING]";
//       const formattedDescription = targetDesc ? `${tag} ${targetDesc}` : tag;

//       const updateData: {
//         componentId?: number;
//         amount?: string;
//         description?: string;
//       } = {
//         description: formattedDescription,
//       };

//       if (validated.componentId !== undefined) {
//         updateData.componentId = validated.componentId;
//       }
//       if (validated.amount !== undefined) {
//         updateData.amount = Number(validated.amount).toFixed(2);
//       }

//       const [updatedDetail] = await db
//         .update(payrollDetails)
//         .set(updateData)
//         .where(eq(payrollDetails.detailId, detailId))
//         .returning();

//       // Hitung ulang total payroll induk
//       const updatedPayroll = await this.recalculatePayrollTotals(
//         existingDetail.payrollId,
//       );

//       return res.status(200).json({
//         success: true,
//         message:
//           "Detail payroll berhasil diperbarui dan total gaji dihitung ulang",
//         data: {
//           detail: {
//             ...updatedDetail,
//             type: targetType,
//             description: targetDesc,
//           },
//           payroll: updatedPayroll,
//         },
//       });
//     } catch (error: any) {
//       if (error instanceof ZodError) {
//         return this.handleZodError(error, res);
//       }
//       console.error("Error in updatePayrollDetail:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };

//   // DELETE /finance/payroll-details/:detailId
//   deletePayrollDetail = async (req: AuthRequest, res: Response) => {
//     try {
//       if (!this.checkFinanceRole(req, res)) return;

//       const detailId = Number(req.params.detailId);
//       if (!Number.isInteger(detailId) || detailId <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "ID detail payroll tidak valid",
//         });
//       }

//       const [existingDetail] = await db
//         .select()
//         .from(payrollDetails)
//         .where(eq(payrollDetails.detailId, detailId))
//         .limit(1);

//       if (!existingDetail) {
//         return res.status(404).json({
//           success: false,
//           message: "Data detail payroll tidak ditemukan",
//         });
//       }

//       // Cek status payroll induk
//       const [parentPayroll] = await db
//         .select()
//         .from(payrolls)
//         .where(eq(payrolls.payrollId, existingDetail.payrollId))
//         .limit(1);

//       if (!parentPayroll || parentPayroll.status !== "pending") {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Detail payroll tidak dapat dihapus karena payroll sudah diproses oleh HR",
//         });
//       }

//       await db
//         .delete(payrollDetails)
//         .where(eq(payrollDetails.detailId, detailId));

//       // Hitung ulang total payroll induk
//       const updatedPayroll = await this.recalculatePayrollTotals(
//         existingDetail.payrollId,
//       );

//       return res.status(200).json({
//         success: true,
//         message:
//           "Detail payroll berhasil dihapus dan total nominal gaji dihitung ulang",
//         data: {
//           payroll: updatedPayroll,
//         },
//       });
//     } catch (error) {
//       console.error("Error in deletePayrollDetail:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Terjadi kesalahan pada server",
//       });
//     }
//   };
// }

// export default new FinanceController();
