import { Router } from "express";
import { getAllCities } from "../controller/provinsi/cities";

const router = Router()

router.get("/", getAllCities)

export default router