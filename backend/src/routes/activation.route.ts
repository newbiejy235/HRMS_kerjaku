import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import { activationBot } from "../controller/activation";
const router = Router();

router.post("/", authenticate, activationBot);

export default router;
