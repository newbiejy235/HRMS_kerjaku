import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import HRfeatures from "../controller/HR/fiturHR.controller";
const router = Router();

router.patch("/:employeeId", authenticate, HRfeatures.manageEmployee);
router.patch(
  "/shift-settings/:id_settings",
  authenticate,
  HRfeatures.employeeShiftSettings,
);
router.post("/shift", authenticate, HRfeatures.createEmployeeShift);
router.patch("/shift/:shiftId", authenticate, HRfeatures.updateEmployeeShift);
router.get("/", authenticate, HRfeatures.getAllShiftSchedules);
router.get("/attendance", authenticate, HRfeatures.getAllAttendanceEmployee);
router.get("/excel-report", authenticate, HRfeatures.exportExcelAttendance);
router.get("/export-employee",authenticate, HRfeatures.exportExcelEmployee);
router.get("/export-shift", authenticate, HRfeatures.exportExcelShift);
router.post("/response/permission", authenticate, HRfeatures.HRresponsePermission);
router.post("/response/overtime", authenticate, HRfeatures.HRresponseOvertime);

router.get("/payroll/pending", authenticate, HRfeatures.getPendingPayrollRequests);
router.post("/payroll/approval", authenticate, HRfeatures.approvePayrollRequest);
router.post("/response/payroll", authenticate, HRfeatures.approvePayrollRequest);

export default router;
