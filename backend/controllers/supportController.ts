import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";

/* ─── helpers ─── */
const generateTicketNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TKT-${code}`;
};

const priorityOrder: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

/** Get all super admin user IDs */
const getSuperAdminIds = async (): Promise<string[]> => {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .eq("is_deleted", false);
    
    if (error) throw error;
    return (admins ?? []).map((a: any) => a.id);
  } catch (err) {
    console.warn("Failed to get super admin IDs:", err);
    return [];
  }
};

/* ─── controller ─── */
export const supportController = {
  /* ============================================
   * GET /api/support/tickets/stats
   * Super-admin only – aggregate ticket stats
   * ============================================ */
  getTicketStats: async (req: Request, res: Response) => {
    try {
      const { data: tickets, error } = await supabaseAdmin
        .from("support_tickets")
        .select("status, priority")
        .eq("is_deleted", false);

      if (error) throw error;

      const open = tickets.filter((t) => t.status === "Open").length;
      const pending = tickets.filter((t) => t.status === "Pending").length;
      const inProgress = tickets.filter((t) => t.status === "In Progress").length;
      const resolved = tickets.filter((t) => t.status === "Resolved").length;
      const closed = tickets.filter((t) => t.status === "Closed").length;
      const urgent = tickets.filter((t) => t.priority === "Urgent").length;

      return res.json({
        open,
        pending,
        inProgress,
        resolved,
        closed,
        urgent,
        total: tickets.length,
      });
    } catch (err: any) {
      console.error("getTicketStats error:", err);
      return res.status(500).json({ error: err.message || "Failed to get ticket stats" });
    }
  },

  /* ============================================
   * GET /api/support/tickets
   * – Regular users see only their own tickets
   * – Super-admins see all tickets
   * ============================================ */
  getTickets: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const isSuperAdmin = user.role === "super_admin";
      const { status, search } = req.query;

      let query = supabaseAdmin
        .from("support_tickets")
        .select("*, profiles:user_id(first_name, last_name, email, avatar_url)")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (!isSuperAdmin) {
        query = query.eq("user_id", user.id);
      }

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`subject.ilike.%${search}%,ticket_number.ilike.%${search}%`);
      }

      const { data: tickets, error } = await query;
      if (error) throw error;

      // For each ticket, get message count
      const ticketIds = tickets.map((t: any) => t.id);
      const { data: messageCounts, error: mcErr } = await supabaseAdmin
        .from("ticket_messages")
        .select("ticket_id")
        .in("ticket_id", ticketIds.length ? ticketIds : ["00000000-0000-0000-0000-000000000000"]);

      if (mcErr) throw mcErr;

      const countMap: Record<string, number> = {};
      messageCounts.forEach((m: any) => {
        countMap[m.ticket_id] = (countMap[m.ticket_id] || 0) + 1;
      });

      const enriched = tickets.map((t: any) => ({
        ...t,
        message_count: countMap[t.id] || 0,
        user_name: t.profiles
          ? `${t.profiles.first_name || ""} ${t.profiles.last_name || ""}`.trim()
          : "Unknown",
        user_email: t.profiles?.email || "",
        user_avatar: t.profiles?.avatar_url || "",
      }));

      return res.json(enriched);
    } catch (err: any) {
      console.error("getTickets error:", err);
      return res.status(500).json({ error: err.message || "Failed to get tickets" });
    }
  },

  /* ============================================
   * GET /api/support/tickets/:id
   * Ticket detail + all messages
   * ============================================ */
  getTicketDetail: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const { data: ticket, error: tErr } = await supabaseAdmin
        .from("support_tickets")
        .select("*, profiles:user_id(first_name, last_name, email, avatar_url)")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (tErr || !ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Regular users can only view their own tickets
      if (user.role !== "super_admin" && ticket.user_id !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get messages with sender info
      const { data: messages, error: mErr } = await supabaseAdmin
        .from("ticket_messages")
        .select("*, profiles:sender_id(first_name, last_name, email, avatar_url)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (mErr) throw mErr;

      const enrichedMessages = (messages || []).map((m: any) => ({
        id: m.id,
        message: m.message,
        is_staff: m.is_staff,
        created_at: m.created_at,
        sender_name: m.profiles
          ? `${m.profiles.first_name || ""} ${m.profiles.last_name || ""}`.trim()
          : "Unknown",
        sender_email: m.profiles?.email || "",
        sender_avatar: m.profiles?.avatar_url || "",
      }));

      return res.json({
        ...ticket,
        user_name: ticket.profiles
          ? `${ticket.profiles.first_name || ""} ${ticket.profiles.last_name || ""}`.trim()
          : "Unknown",
        user_email: ticket.profiles?.email || "",
        user_avatar: ticket.profiles?.avatar_url || "",
        messages: enrichedMessages,
      });
    } catch (err: any) {
      console.error("getTicketDetail error:", err);
      return res.status(500).json({ error: err.message || "Failed to get ticket detail" });
    }
  },

  /* ============================================
   * POST /api/support/tickets
   * Create a new ticket (any authenticated user)
   * ============================================ */
  createTicket: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { subject, message, user_type, priority } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }

      // Generate unique ticket number
      let ticketNumber = generateTicketNumber();
      // Make sure it's unique
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabaseAdmin
          .from("support_tickets")
          .select("id")
          .eq("ticket_number", ticketNumber)
          .maybeSingle();
        if (!existing) break;
        ticketNumber = generateTicketNumber();
        attempts++;
      }

      const { data: ticket, error: tErr } = await supabaseAdmin
        .from("support_tickets")
        .insert({
          ticket_number: ticketNumber,
          user_id: user.id,
          subject,
          user_type: user_type || "Customer",
          priority: priority || "Medium",
          status: "Open",
        })
        .select()
        .single();

      if (tErr) throw tErr;

      // Insert the first message
      const { error: mErr } = await supabaseAdmin
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message,
          is_staff: false,
        });

      if (mErr) throw mErr;

      // Notify super admins about the new ticket
      try {
        const superAdminIds = await getSuperAdminIds();
        const userProfile = await supabaseAdmin
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        
        const userName = userProfile.data
          ? `${userProfile.data.first_name || ""} ${userProfile.data.last_name || ""}`.trim()
          : "A user";

        for (const adminId of superAdminIds) {
          await notificationModel.create({
            user_id: adminId,
            type: "new_ticket",
            title: "New Support Ticket",
            message: `${userName} has submitted a new support ticket: "${subject}"`,
            link: `/admin/support/${ticket.id}`,
            reference_id: ticket.id,
            reference_type: "support_ticket",
          });
        }
      } catch (notifErr) {
        console.warn("Failed to notify super admins about new ticket:", notifErr);
        // Don't fail the request if notification creation fails
      }

      return res.status(201).json(ticket);
    } catch (err: any) {
      console.error("createTicket error:", err);
      return res.status(500).json({ error: err.message || "Failed to create ticket" });
    }
  },

  /* ============================================
   * POST /api/support/tickets/:id/messages
   * Send a message (user or super-admin)
   * ============================================ */
  sendMessage: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Verify ticket exists
      const { data: ticket, error: tErr } = await supabaseAdmin
        .from("support_tickets")
        .select("id, user_id, status")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (tErr || !ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Regular users can only send messages on their own tickets
      if (user.role !== "super_admin" && ticket.user_id !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const isStaff = user.role === "super_admin";

      const { data: msg, error: mErr } = await supabaseAdmin
        .from("ticket_messages")
        .insert({
          ticket_id: id,
          sender_id: user.id,
          message,
          is_staff: isStaff,
        })
        .select("*, profiles:sender_id(first_name, last_name, email, avatar_url)")
        .single();

      if (mErr) throw mErr;

      // If super-admin replies, update status to "In Progress" (if it was Open/Pending)
      if (isStaff && ["Open", "Pending"].includes(ticket.status)) {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "In Progress", updated_at: new Date().toISOString() })
          .eq("id", id);
      }

      // If user replies and ticket was Resolved/Closed, re-open it
      if (!isStaff && ["Resolved", "Closed"].includes(ticket.status)) {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "Open", updated_at: new Date().toISOString() })
          .eq("id", id);
      }

      // Create notifications based on who sent the message
      try {
        const senderProfile = await supabaseAdmin
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        
        const senderName = senderProfile.data
          ? `${senderProfile.data.first_name || ""} ${senderProfile.data.last_name || ""}`.trim()
          : "A user";

        if (isStaff) {
          // Super admin reply -> notify the ticket creator (admin/proprietor)
          await notificationModel.create({
            user_id: ticket.user_id,
            type: "ticket_reply",
            title: "New Reply to Your Ticket",
            message: `A super admin has replied to your support ticket: "${msg.message.substring(0, 50)}..."`,
            link: `/support/${ticket.id}`,
            reference_id: ticket.id,
            reference_type: "support_ticket",
          });
        } else {
          // User reply -> notify all super admins
          const superAdminIds = await getSuperAdminIds();
          for (const adminId of superAdminIds) {
            await notificationModel.create({
              user_id: adminId,
              type: "ticket_reply",
              title: "New Reply on Support Ticket",
              message: `${senderName} has replied to a support ticket: "${msg.message.substring(0, 50)}..."`,
              link: `/admin/support/${ticket.id}`,
              reference_id: ticket.id,
              reference_type: "support_ticket",
            });
          }
        }
      } catch (notifErr) {
        console.warn("Failed to create ticket reply notification:", notifErr);
        // Don't fail the request if notification creation fails
      }

      return res.status(201).json({
        id: msg.id,
        message: msg.message,
        is_staff: msg.is_staff,
        created_at: msg.created_at,
        sender_name: msg.profiles
          ? `${msg.profiles.first_name || ""} ${msg.profiles.last_name || ""}`.trim()
          : "Unknown",
        sender_email: msg.profiles?.email || "",
        sender_avatar: msg.profiles?.avatar_url || "",
      });
    } catch (err: any) {
      console.error("sendMessage error:", err);
      return res.status(500).json({ error: err.message || "Failed to send message" });
    }
  },

  /* ============================================
   * PATCH /api/support/tickets/:id/status
   * Super-admin updates ticket status
   * ============================================ */
  updateTicketStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ["Open", "Pending", "In Progress", "Resolved", "Closed"];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const { data, error } = await supabaseAdmin
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("is_deleted", false)
        .select()
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Ticket not found" });

      return res.json(data);
    } catch (err: any) {
      console.error("updateTicketStatus error:", err);
      return res.status(500).json({ error: err.message || "Failed to update ticket status" });
    }
  },
};
