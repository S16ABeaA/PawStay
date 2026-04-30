import { Request, Response } from "express";
import { notificationModel } from "../models/notificationModel";
import { logger } from "../utils/logger";

/** GET /api/notifications — list notifications for the authenticated user */
export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const { notifications, total } = await notificationModel.listByUser(userId, { limit, offset });
    return res.json({ notifications, total, limit, offset });
  } catch (err: any) {
    logger.error("listNotifications error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** GET /api/notifications/unread-count — get unread notification count */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const count = await notificationModel.unreadCount(userId);
    return res.json({ count });
  } catch (err: any) {
    logger.error("getUnreadCount error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** POST /api/notifications — create a notification (admin / system use) */
export const createNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { target_user_id, type, title, message, link, reference_id, reference_type } = req.body;

    // Allow creating notifications for yourself, or if you're admin/proprietor for other users
    const targetUserId = target_user_id || userId;
    const userRole = (req as any).user?.role;

    if (targetUserId !== userId && !["admin", "proprietor"].includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: cannot create notifications for other users" });
    }

    if (!title || !message) {
      return res.status(400).json({ error: "Missing required fields: title, message" });
    }

    const notification = await notificationModel.create({
      user_id: targetUserId,
      type: type || "info",
      title,
      message,
      link,
      reference_id,
      reference_type,
    });

    return res.status(201).json({ notification });
  } catch (err: any) {
    logger.error("createNotification error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** PATCH /api/notifications/:id/read — mark a notification as read */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notification = await notificationModel.markRead(req.params.id as string, userId);
    return res.json({ notification });
  } catch (err: any) {
    logger.error("markAsRead error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** PATCH /api/notifications/read-all — mark all notifications as read */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const count = await notificationModel.markAllRead(userId);
    return res.json({ updated: count });
  } catch (err: any) {
    logger.error("markAllAsRead error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** DELETE /api/notifications/:id — soft-delete a notification */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await notificationModel.remove(req.params.id as string, userId);
    return res.json({ success: true });
  } catch (err: any) {
    logger.error("deleteNotification error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/** DELETE /api/notifications — soft-delete all notifications for the user */
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const count = await notificationModel.removeAll(userId);
    return res.json({ deleted: count });
  } catch (err: any) {
    logger.error("deleteAllNotifications error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
