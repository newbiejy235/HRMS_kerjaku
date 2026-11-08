import { Router } from "express";
import  HRfeatures  from "../controller/HR/fiturHR.controller";
import { authenticate } from "../middleware/users.middleware";

const router = Router();

router.post("/", authenticate, HRfeatures.VerificationForgetPassword);
router.post("/review", authenticate, HRfeatures.reviewForgetPassword);

export default router;