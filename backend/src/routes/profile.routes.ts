import { authenticate } from "../middleware/users.middleware";
import EmployeeFeatures from "../controller/employee/employee.controller";
import { Router } from "express";

const router = Router();

router.get("/myProfile", authenticate, EmployeeFeatures.employeeProfile);
router.get("/", EmployeeFeatures.log);

export default router;
