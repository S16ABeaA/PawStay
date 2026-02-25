import { supabaseAdmin } from "../config/supabaseAdmin";

export interface NotificationRow {
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

export const notificationModel = {
  /** Create a new notification */
  async create(
    data: Pick<NotificationRow, "user_id" | "type" | "title" | "message"> &
      Partial<Pick<NotificationRow, "link" | "reference_id" | "reference_type">>
  ): Promise<NotificationRow> {
    const { data: row, error } = await supabaseAdmin
      .from("notifications")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row;
  },

  /** List notifications for a user (newest first), excluding deleted */
  async listByUser(
    userId: string,
    { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
  ): Promise<{ notifications: NotificationRow[]; total: number }> {
    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false);

    if (countError) throw countError;

    // Get paginated results
    const { data: rows, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { notifications: rows ?? [], total: count ?? 0 };
  },

  /** Get unread count for a user */
  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .eq("is_deleted", false);

    if (error) throw error;
    return count ?? 0;
  },

  /** Mark a single notification as read */
  async markRead(notificationId: string, userId: string): Promise<NotificationRow> {
    const { data: row, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return row;
  },

  /** Mark all notifications as read for a user */
  async markAllRead(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .eq("is_deleted", false)
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  },

  /** Soft-delete a single notification */
  async remove(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_deleted: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  /** Soft-delete all notifications for a user */
  async removeAll(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_deleted: true })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  },
};
