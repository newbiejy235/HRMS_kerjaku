import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import FinanceController from "../controller/finance/finance.controller";
import HRfeatures from "../controller/HR/fiturHR.controller";

const router = Router();

router.get("/components", authenticate, HRfeatures.getAllPayrollComponents);
router.post("/components", authenticate, HRfeatures.addComponent);
router.patch("/components/:id", authenticate, HRfeatures.updateComponent);

// ==========================================
// C. Allocation Payroll
// ==========================================
// GET http://localhost:8000/finance/allocations?employeeId=EMP001
router.get("/allocations", authenticate, HRfeatures.getAllPayrollAllocations);
router.get(
  "/allocations/:employeeId",
  authenticate,
  HRfeatures.getPayrollAllocationByEmployee,
);
router.post("/allocations", authenticate, HRfeatures.payrollAlocation);
// router.patch("/allocations/:allocationId", authenticate, FinanceController.updatePayrollAllocation);
// router.delete("/allocations/:allocationId", authenticate, FinanceController.deletePayrollAllocation);

// ==========================================
// D. Payroll Transactions & Payroll Details
// ==========================================
// GET http://localhost:8000/finance/payrolls?employeeId=EMP001
// GET http://localhost:8000/finance/payrolls?payrollPeriod=2026-11
// GET http://localhost:8000/finance/payrolls?status=pending
// GET http://localhost:8000/finance/payrolls?employeeId=EMP001&payrollPeriod=2026-11&status=pending
router.get("/payrolls", authenticate, FinanceController.getAllPayrollDetails);
router.get("/payrolls/all", authenticate, FinanceController.getAllPayrolls);
// router.get("/payrolls/:payrollId", authenticate, FinanceController.getPayrollById);
router.post("/payrolls/generate", authenticate, FinanceController.generatePayroll);
// router.delete("/payrolls/:payrollId", authenticate, FinanceController.deletePayroll);

// router.get("/payroll-details", authenticate, FinanceController.getAllPayrollDetails);
// router.post("/payroll-details", authenticate, FinanceController.createPayrollDetail);
// router.patch("/payroll-details/:detailId", authenticate, FinanceController.updatePayrollDetail);
// router.delete("/payroll-details/:detailId", authenticate, FinanceController.deletePayrollDetail);

export default router;
