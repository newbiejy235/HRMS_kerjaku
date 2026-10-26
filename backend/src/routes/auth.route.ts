import { Router } from "express";
import Authentication from "../controller/auth.controller";
const router = Router()

router.post("/auth/register", Authentication.register )

export default router