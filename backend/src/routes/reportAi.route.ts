import { Router } from "express";
// import { authenticate } from "../middleware/users.middleware";
// import HRfeatures from "../controller/HR/fiturHR.controller";
import  GeminiController  from "../controller/report/gemini.report";
const router = Router();

router.get("/", GeminiController.testGemini);

export default router
