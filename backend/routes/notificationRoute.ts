import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { authBrowseHourlyLimiter, bookingOpsHourlyLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams, validateQuery } from "../middleware/inputValidation";
import {
  listNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController";

const router = Router();

const createNotificationSchema = {
  target_user_id: { type: "uuid", required: false },
  type: { type: "string", required: false, maxLength: 50 },
  title: { type: "string", required: true, minLength: 1, maxLength: 120 },
  message: { type: "string", required: true, minLength: 1, maxLength: 2000 },
  link: { type: "string", required: false, maxLength: 300 },
  reference_id: { type: "uuid", required: false },
  reference_type: { type: "string", required: false, maxLength: 50 },
} as const;

const notificationMutationSchema = {
  note: { type: "string", required: false, maxLength: 50 },
} as const;

const notificationIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const notificationsQuerySchema = {
  limit: { type: "number", required: false, min: 1, max: 100 },
  offset: { type: "number", required: false, min: 0, max: 10000 },
} as const;

// All notification routes require authentication
router.use(authMiddleware);

router.get("/", authBrowseHourlyLimiter, validateQuery(notificationsQuerySchema), listNotifications);
router.get("/unread-count", authBrowseHourlyLimiter, getUnreadCount);
router.post("/", bookingOpsHourlyLimiter, validateBody(createNotificationSchema), createNotification);
router.patch("/read-all", bookingOpsHourlyLimiter, validateBody(notificationMutationSchema), markAllAsRead);
router.patch("/:id/read", bookingOpsHourlyLimiter, validateParams(notificationIdParamSchema), validateBody(notificationMutationSchema), markAsRead);
router.delete("/all", bookingOpsHourlyLimiter, deleteAllNotifications);
router.delete("/:id", bookingOpsHourlyLimiter, validateParams(notificationIdParamSchema), deleteNotification);

export default router;
