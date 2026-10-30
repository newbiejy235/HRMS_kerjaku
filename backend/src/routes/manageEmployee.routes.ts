import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import HRfeatures from "../controller/HR/fiturHR.controller";
const router = Router();

router.patch("/:employeeId", authenticate, HRfeatures.manageEmployee);
router.patch("/shift-settings/:id_settings", HRfeatures.employeeShiftSettings);

export default router;
