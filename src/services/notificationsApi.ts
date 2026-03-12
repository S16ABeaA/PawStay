import { authHelper } from "../helpers/authHelper";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5001";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export const notificationsApi = {
  /** Fetch paginated notifications for the current user */
  list: async (
    limit = 50,
    offset = 0
  ): Promise<NotificationsResponse> => {
    return authHelper.get(
      `${API_BASE_URL}/api/notifications?limit=${limit}&offset=${offset}`
    );
  },

  /** Get the unread notification count */
  unreadCount: async (): Promise<number> => {
    const data = await authHelper.get(
      `${API_BASE_URL}/api/notifications/unread-count`
    );
    return data.count ?? 0;
  },

  /** Mark a single notification as read */
  markRead: async (id: string): Promise<Notification> => {
    const data = await authHelper.patch(
      `${API_BASE_URL}/api/notifications/${id}/read`,
      {}
    );
    return data.notification;
  },

  /** Mark all notifications as read */
  markAllRead: async (): Promise<number> => {
    const data = await authHelper.patch(
      `${API_BASE_URL}/api/notifications/read-all`,
      {}
    );
    return data.updated ?? 0;
  },

  /** Delete a single notification */
  remove: async (id: string): Promise<void> => {
    await authHelper.delete(`${API_BASE_URL}/api/notifications/${id}`);
  },

  /** Delete all notifications */
  removeAll: async (): Promise<number> => {
    const data = await authHelper.delete(
      `${API_BASE_URL}/api/notifications/all`
    );
    return data.deleted ?? 0;
  },
};
