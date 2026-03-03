import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const BASE = `${API_BASE_URL}/api/support`;

/* ─── Types ─── */
export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  user_type: string;
  priority: string;
  status: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_name: string;
  user_email: string;
  user_avatar: string;
}

export interface TicketMessage {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  sender_name: string;
  sender_email: string;
  sender_avatar: string;
}

export interface TicketDetail extends SupportTicket {
  messages: TicketMessage[];
}

export interface TicketStats {
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  total: number;
}

/* ─── API ─── */
export const supportApi = {
  /** Get ticket stats (super-admin) */
  getStats: (): Promise<TicketStats> => authHelper.get(`${BASE}/tickets/stats`),

  /** List tickets */
  getTickets: (params?: { status?: string; search?: string }): Promise<SupportTicket[]> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return authHelper.get(`${BASE}/tickets${query ? `?${query}` : ""}`);
  },

  /** Get ticket detail with messages */
  getTicket: (id: string): Promise<TicketDetail> => authHelper.get(`${BASE}/tickets/${id}`),

  /** Create a new ticket */
  createTicket: (data: {
    subject: string;
    message: string;
    user_type?: string;
    priority?: string;
  }): Promise<SupportTicket> => authHelper.post(`${BASE}/tickets`, data),

  /** Send a message on a ticket */
  sendMessage: (ticketId: string, message: string): Promise<TicketMessage> =>
    authHelper.post(`${BASE}/tickets/${ticketId}/messages`, { message }),

  /** Update ticket status (super-admin) */
  updateStatus: (ticketId: string, status: string): Promise<SupportTicket> =>
    authHelper.patch(`${BASE}/tickets/${ticketId}/status`, { status }),
};
