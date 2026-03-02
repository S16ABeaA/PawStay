import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
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

// All notification routes require authentication
router.use(authMiddleware);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/", createNotification);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/all", deleteAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
