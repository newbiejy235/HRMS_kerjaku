import { authenticate } from "../middleware/users.middleware";
import EmployeeFeatures from "../controller/employee/employee.controller";
import HRfeatures from "../controller/HR/fiturHR.controller";
import financeController from "../controller/finance/finance.controller";
import { Router } from "express";

const router = Router();

router.get("/myProfile", authenticate, EmployeeFeatures.employeeProfile);
router.get("/my-shift", authenticate, EmployeeFeatures.myShiftSchedule);
router.get("/", authenticate, HRfeatures.getAllEmployee);

// GET /api/payroll/my-slip?period=2026-11 <-- untuk lihat dari rentang periode
router.get("/my-slip", authenticate, EmployeeFeatures.mySlip);

export default router;
