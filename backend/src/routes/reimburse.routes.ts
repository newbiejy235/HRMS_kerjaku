import { Router } from "express";

import { ReimbursementController } from "../controller/reimburse/reimburse.controller";
import { authenticate } from "../middleware/users.middleware";
import { reimburseUpload } from "../middleware/reimburseUpload";

const router = Router();
const reimbursementController = new ReimbursementController();

// POST: Employee mengajukan reimburse
router.post(
  "/",
  authenticate,
  reimburseUpload.single("receipt"),
  reimbursementController.createReimbursement
);

// GET: Employee melihat daftar reimburse miliknya
router.get(
  "/",
  authenticate,
  reimbursementController.getReimbursements
);

// HR: Approve / Reject Reimbursement
router.patch(
  "/:id/review",
  authenticate,
  reimbursementController.reviewReimbursement
);

export default router;