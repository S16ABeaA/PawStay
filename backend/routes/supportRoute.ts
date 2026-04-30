import { Router } from "express";
import { supportController } from "../controllers/supportController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { authBrowseHourlyLimiter, bulkOpsLimiter, messagingHourlyLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams, validateQuery } from "../middleware/inputValidation";

const router = Router();

const ticketIdParamSchema = {
	id: { type: "uuid", required: true },
} as const;

const ticketsQuerySchema = {
	status: { type: "string", required: false, maxLength: 20 },
	page: { type: "number", required: false, min: 1 },
	limit: { type: "number", required: false, min: 1, max: 100 },
} as const;

const createTicketSchema = {
	subject: { type: "string", required: true, minLength: 3, maxLength: 120, pattern: /^[a-zA-Z0-9\s,.'\-?!()#:/]*$/ },
	message: { type: "string", required: true, minLength: 1, maxLength: 2000 },
	user_type: { type: "enum", required: false, enumValues: ["Customer", "Proprietor", "Admin", "Super Admin"] },
	priority: { type: "enum", required: false, enumValues: ["Low", "Medium", "High", "Urgent"] },
} as const;

const messageSchema = {
	message: { type: "string", required: true, minLength: 1, maxLength: 2000 },
} as const;

const statusSchema = {
	status: { type: "enum", required: true, enumValues: ["Open", "Pending", "In Progress", "Resolved", "Closed"] },
} as const;

// All support routes require authentication
router.use(authMiddleware);

// Stats – super-admin only
router.get("/tickets/stats", authBrowseHourlyLimiter, requireSuperAdmin, supportController.getTicketStats);

// List tickets (user sees own, super-admin sees all)
router.get("/tickets", authBrowseHourlyLimiter, validateQuery(ticketsQuerySchema), supportController.getTickets);

// Per-ticket unread chat indicators for badges/dots
router.get(
	"/tickets/unread-indicators",
	authBrowseHourlyLimiter,
	authMiddleware,
	supportController.getUnreadIndicators
);

// Get ticket detail with messages
router.get("/tickets/:id", authBrowseHourlyLimiter, validateParams(ticketIdParamSchema), supportController.getTicketDetail);

// Create a new ticket
router.post("/tickets", bulkOpsLimiter, validateBody(createTicketSchema), supportController.createTicket);

// Send a message on a ticket
router.post("/tickets/:id/messages", validateParams(ticketIdParamSchema), validateBody(messageSchema), messagingHourlyLimiter, supportController.sendMessage);

// Update ticket status – super-admin only
router.patch("/tickets/:id/status", bulkOpsLimiter, validateParams(ticketIdParamSchema), validateBody(statusSchema), requireSuperAdmin, supportController.updateTicketStatus);

export default router;
