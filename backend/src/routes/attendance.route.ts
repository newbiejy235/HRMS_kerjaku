import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import employeeController from "../controller/employee/employee.controller";
const router = Router();

router.post(
  "/qr/generate",
  authenticate,
  employeeController.generateAttendanceQr,
);

router.post("/", authenticate, employeeController.attendance);

export default router;
