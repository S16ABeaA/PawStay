import { supabaseAdmin } from "../config/supabaseAdmin";

export interface ServiceHistoryRow {
  id: string;
  pet_id: string;
  booking_id: string | null;
  service_type: string;
  service_name: string;
  performed_at: string;
  notes: string | null;
  created_at: string;
}

export const serviceHistoryModel = {
  /** Create a service history entry */
  async create(data: {
    pet_id: string;
    booking_id?: string | null;
    service_type: string;
    service_name: string;
    performed_at: string;
    notes?: string | null;
  }): Promise<ServiceHistoryRow> {
    const { data: row, error } = await supabaseAdmin
      .from("pet_service_history")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row;
  },

  /** Get all service history for a pet */
  async getByPet(petId: string): Promise<ServiceHistoryRow[]> {
    const { data, error } = await supabaseAdmin
      .from("pet_service_history")
      .select("*")
      .eq("pet_id", petId)
      .order("performed_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /** Get all service history for all pets owned by a user */
  async getByOwner(ownerId: string): Promise<ServiceHistoryRow[]> {
    // We need a join: pet_service_history → pets via pet_id, filter by owner_id
    const { data, error } = await supabaseAdmin
      .from("pet_service_history")
      .select("*, pets!inner(owner_id)")
      .eq("pets.owner_id", ownerId)
      .order("performed_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pets, ...rest } = row;
      return rest as ServiceHistoryRow;
    });
  },
};
