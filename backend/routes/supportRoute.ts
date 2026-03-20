import { Router } from "express";
import { supportController } from "../controllers/supportController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";

const router = Router();

// All support routes require authentication
router.use(authMiddleware);

// Stats – super-admin only
router.get("/tickets/stats", requireSuperAdmin, supportController.getTicketStats);

// List tickets (user sees own, super-admin sees all)
router.get("/tickets", supportController.getTickets);

// Per-ticket unread chat indicators for badges/dots
router.get("/tickets/unread-indicators", supportController.getUnreadIndicators);

// Get ticket detail with messages
router.get("/tickets/:id", supportController.getTicketDetail);

// Create a new ticket
router.post("/tickets", supportController.createTicket);

// Send a message on a ticket
router.post("/tickets/:id/messages", supportController.sendMessage);

// Update ticket status – super-admin only
router.patch("/tickets/:id/status", requireSuperAdmin, supportController.updateTicketStatus);

export default router;
