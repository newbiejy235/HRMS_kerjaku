import { Router } from "express";

import { authenticate } from "../middleware/users.middleware";
import getNotificationController from "../controller/getNotification/getNotification.controller";

const router = Router();

router.get(
  "/permission",
  authenticate,
  getNotificationController.getPermissionNotifications,
);

router.get(
  "/overtime",
  authenticate,
  getNotificationController.getOvertimeNotifications,
);

router.get(
  "/reimbursement",
  authenticate,
  getNotificationController.getReimbursementNotifications,
);

router.get(
  "/reset-password",
  authenticate,
  getNotificationController.getResetPasswordNotifications,
);

export default router;
