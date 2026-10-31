import { authenticate } from "../middleware/users.middleware";
import EmployeeFeatures from "../controller/employee/employee.controller";
import HRfeatures from "../controller/HR/fiturHR.controller";
import { Router } from "express";

const router = Router();

router.get("/myProfile", authenticate, EmployeeFeatures.employeeProfile);
router.get("/my-shift", authenticate, EmployeeFeatures.myShiftSchedule);
router.get("/", authenticate, HRfeatures.getAllEmployee);

export default router;
