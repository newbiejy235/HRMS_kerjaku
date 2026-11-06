import { Router } from "express";

import {
  createAttendanceLocation,
  getAttendanceLocation,
  updateAttendanceLocation,
  updateAttendanceLocationStatus,
} from "../controller/location/attendanceLocation.controller";

import { authenticate } from "../middleware/users.middleware";

const router = Router();

router.use(authenticate);

router.post("/", createAttendanceLocation);
router.get("/", getAttendanceLocation);
router.put("/:id", updateAttendanceLocation);
router.patch("/:id/status", updateAttendanceLocationStatus);

export default router;
