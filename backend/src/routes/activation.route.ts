import { Router } from "express";
import { authenticate } from "../middleware/users.middleware";
import { activationBot } from "../controller/activation";
import TelegramController from "../controller/activation/start.controller";
const router = Router();

router.post("/", authenticate, activationBot);
router.post("/pairing", authenticate, TelegramController.createTelegramPairing);

router.get("/status", authenticate, TelegramController.getTelegramStatus);

export default router;
