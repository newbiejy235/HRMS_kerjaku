import { Router } from "express";
import Authentication from "../controller/auth.controller";
const router = Router()

router.post("/register", Authentication.register )
router.post("/login", Authentication.login)
router.post("/forget", Authentication.forgetPassword)
router.post("/reset-with-token", Authentication.resetPasswordWithToken);

export default router