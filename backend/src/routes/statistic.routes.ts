import { Router } from "express";

import HRfeatures from "../controller/HR/fiturHR.controller";

import { authenticate } from "../middleware/users.middleware";

const router = Router();

// Generate statistik seluruh karyawan.
router.post(
  "/attendance-statistics/generate",
  authenticate,
  HRfeatures.generateAttendanceStatistics,
);

// Get seluruh statistik berdasarkan bulan dan tahun.
router.get(
  "/attendance-statistics",
  authenticate,
  HRfeatures.getAttendanceStatistics,
);

// Get statistik satu karyawan.
router.get(
  "/attendance-statistics/:employeeId",
  authenticate,
  HRfeatures.getEmployeeAttendanceStatistics,
);

export default router;
