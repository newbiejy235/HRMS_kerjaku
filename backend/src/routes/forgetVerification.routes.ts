import { Router } from "express";
import  HRfeatures  from "../controller/HR/fiturHR.controller";

const router = Router();

router.post("/", HRfeatures.VerificationForgetPassword);
router.post("/review", HRfeatures.reviewForgetPassword);

export default router;