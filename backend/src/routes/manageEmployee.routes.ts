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

export default router;
