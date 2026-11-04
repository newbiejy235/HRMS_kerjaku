import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import FinanceController from "../controller/finance/finance.controller";

const router = Router();

// ==========================================
// A. Payroll Component (Master Data)
// ==========================================
router.get("/components", authenticate, FinanceController.getAllPayrollComponents);
router.post("/components", authenticate, FinanceController.createPayrollComponent);
router.delete("/components/:id", authenticate, FinanceController.deletePayrollComponent);

// ==========================================
// B. Employee Payroll Component
// ==========================================
router.get("/employee-components", authenticate, FinanceController.getAllEmployeePayrollComponents);
router.post("/employee-components", authenticate, FinanceController.createEmployeePayrollComponent);
router.patch("/employee-components/:id", authenticate, FinanceController.updateEmployeePayrollComponent);
router.delete("/employee-components/:id", authenticate, FinanceController.deleteEmployeePayrollComponent);

// ==========================================
// C. Allocation Payroll
// ==========================================
// GET http://localhost:8000/finance/allocations?employeeId=EMP001
router.get("/allocations", authenticate, FinanceController.getAllPayrollAllocations);
router.post("/allocations", authenticate, FinanceController.createPayrollAllocation);
router.patch("/allocations/:allocationId", authenticate, FinanceController.updatePayrollAllocation);
router.delete("/allocations/:allocationId", authenticate, FinanceController.deletePayrollAllocation);

// ==========================================
// D. Payroll Transactions & Payroll Details
// ==========================================
// GET http://localhost:8000/finance/payrolls?employeeId=EMP001
// GET http://localhost:8000/finance/payrolls?payrollPeriod=2026-11
// GET http://localhost:8000/finance/payrolls?status=pending
// GET http://localhost:8000/finance/payrolls?employeeId=EMP001&payrollPeriod=2026-11&status=pending
router.get("/payrolls", authenticate, FinanceController.getAllPayrolls);
router.get("/payrolls/:payrollId", authenticate, FinanceController.getPayrollById);
router.post("/payrolls", authenticate, FinanceController.createPayroll);
router.delete("/payrolls/:payrollId", authenticate, FinanceController.deletePayroll);

router.get("/payroll-details", authenticate, FinanceController.getAllPayrollDetails);
router.post("/payroll-details", authenticate, FinanceController.createPayrollDetail);
router.patch("/payroll-details/:detailId", authenticate, FinanceController.updatePayrollDetail);
router.delete("/payroll-details/:detailId", authenticate, FinanceController.deletePayrollDetail);

export default router;
