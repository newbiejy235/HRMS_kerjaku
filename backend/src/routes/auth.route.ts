import { Router } from "express";
import Authentication from "../controller/auth.controller";
const router = Router()

router.post("/register", Authentication.register )
router.post("/login", Authentication.login)
router.post("/forget", Authentication.forgetPassword)

export default router