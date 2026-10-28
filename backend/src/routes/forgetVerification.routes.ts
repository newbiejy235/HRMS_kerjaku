import { Router } from "express";
import { HRfeatures } from "../controller/HR/fiturHR.controller";

const router = Router();

const hrFeatures = new HRfeatures();

router.post("/", hrFeatures.VerificationForgetPassword);
router.post("/review", hrFeatures.reviewForgetPassword);

export default router;