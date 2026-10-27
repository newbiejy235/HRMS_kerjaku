import { Router } from "express";
import Authentication from "../controller/auth.controller";
const router = Router()

router.post("/register", Authentication.register )

export default router