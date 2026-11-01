import { authenticate } from "../middleware/users.middleware";
import EmployeeFeatures from "../controller/employee/employee.controller";
import { Router } from "express";

const router = Router();

router.post("/request/employee", authenticate, EmployeeFeatures.employeePermission)

export default router;
