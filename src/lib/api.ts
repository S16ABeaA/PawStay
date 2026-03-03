// src/lib/api.ts
import { supabase } from "@/config/supabaseClient";

// Define interfaces for your data structures (matching Supabase table columns)
// These are examples; adjust them to precisely match your Supabase table definitions.

export interface Hotel {
  id: string; // Assuming UUID
  name: string;
  description: string;
  location: string;
  rating: number;
  reviews: number;
  price: number; // Base price per night
  original_price?: number;
  images: string[];
  amenities: string[];
  features: string[]; // e.g., "Spacious individual suites"
  room_types: Array<{ name: string; price: number; description: string }>;
  hours: string;
  phone: string;
  email: string;
  featured: boolean;
  availability_status: string;
}

export interface VeterinaryClinic {
  id: string; // Assuming UUID
  name: string;
  description: string;
  location: string;
  rating: number;
  reviews: number;
  price: number; // e.g., consultation starting price
  original_price?: number;
  images: string[];
  amenities: string[]; // e.g., "Board Certified", "24/7 Emergency"
  features: string[]; // e.g., "On-site laboratory"
  // IMPORTANT: Assuming 'services' is `text[]` in Supabase for `contains` to work simply.
  // If it's `jsonb` of objects, this filter logic needs a custom RPC function.
  services: Array<{ name: string; price: number; duration: string; description: string }>;
  team: Array<{ name: string; role: string; specialty: string; image: string }>;
  hours: string;
  phone: string;
  email: string;
  featured: boolean;
  availability_status: string;
  emergency_services: boolean;
}

// --- Common Filters & Sorting Interfaces ---
export interface CommonFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string; // Column name to sort by, e.g., 'price', 'rating'
  sortOrder?: 'asc' | 'desc'; // 'asc' or 'desc'
  featured?: boolean; // For filtering featured items
}

// --- Hotel APIs ---

export interface HotelFilters extends CommonFilters {
  amenities?: string[]; // Array of amenities to filter by (e.g., ["WiFi", "24/7 Care"])
}

export async function getHotels(filters?: HotelFilters): Promise<Hotel[]> {
  let query = supabase.from('hotels').select('*');

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`); // Case-insensitive partial match
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.minRating !== undefined) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters?.amenities && filters.amenities.length > 0) {
    // This checks if the 'amenities' array column contains ALL specified amenities
    query = query.contains('amenities', filters.amenities);
  }
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  // Sorting
  if (filters?.sortBy) {
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
  } else {
    // Default sort if none specified
    query = query.order('rating', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching hotels:", error.message);
    throw error; // Propagate error for frontend handling
  }
  return data || [];
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single(); // Expects a single row

  if (error) {
    // If no row is found, Supabase returns an error with code 'PGRST116'
    // You might want to handle this specifically if `id` is not found
    if (error.code === 'PGRST116') {
      console.warn(`Hotel with ID ${id} not found.`);
      return null;
    }
    console.error(`Error fetching hotel with ID ${id}:`, error.message);
    throw error;
  }
  return data;
}

// --- Veterinary Clinics APIs ---

export interface VeterinaryFilters extends CommonFilters {
  services?: string[]; // Array of service names to filter by
  emergencyServices?: boolean; // Filter for clinics offering 24/7 emergency services
}

export async function getVeterinaryClinics(filters?: VeterinaryFilters): Promise<VeterinaryClinic[]> {
  let query = supabase.from('veterinary_clinics').select('*');

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.minRating !== undefined) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters?.emergencyServices !== undefined) {
    query = query.eq('emergency_services', filters.emergencyServices);
  }
  if (filters?.services && filters.services.length > 0) {
    // Assuming the 'services' column in the DB is an array of objects like `[{name: "Service1", ...}]`
    // Supabase's `contains` operator works best for `text[]` or simple `jsonb` arrays of scalar values.
    // For filtering within a `jsonb` array of objects based on a property (e.g., `service.name`),
    // you typically need to use `cs` (contains string) on a casted JSONB column, or an RPC function.
    // For this example, let's assume `services` in the DB is actually a `text[]` column for simplicity.
    // If your actual DB column is `jsonb` of objects, you'll need to create a custom Supabase SQL function (RPC)
    // to search within the JSONB array, and call it like `query = query.rpc('search_vet_services', { service_names: filters.services });`
    query = query.contains('services', filters.services);
  }
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  // Sorting
  if (filters?.sortBy) {
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
  } else {
    query = query.order('rating', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching veterinary clinics:", error.message);
    throw error;
  }
  return data || [];
}

export async function getVeterinaryClinicById(id: string): Promise<VeterinaryClinic | null> {
  const { data, error } = await supabase
    .from('veterinary_clinics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`Veterinary clinic with ID ${id} not found.`);
      return null;
    }
    console.error(`Error fetching veterinary clinic with ID ${id}:`, error.message);
    throw error;
  }
  return data;
}

// --- Grooming Shops APIs ---

export interface GroomingShop {
  id: string;
  name: string;
  description: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  original_price?: number;
  images: string[];
  // IMPORTANT: Assuming 'services' is `text[]` in Supabase for `contains` to work simply.
  services: string[]; 
  featured: boolean;
  availability_status: string;
  hours: string;
  phone: string;
  email: string;
}

export interface GroomingFilters extends CommonFilters {
  services?: string[]; // Array of service names to filter by
}

export async function getGroomingShops(filters?: GroomingFilters): Promise<GroomingShop[]> {
  let query = supabase.from('grooming_shops').select('*'); // Assuming 'grooming_shops' table

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.minRating !== undefined) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters?.services && filters.services.length > 0) {
    query = query.contains('services', filters.services);
  }
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  if (filters?.sortBy) {
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
  } else {
    query = query.order('rating', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching grooming shops:", error.message);
    throw error;
  }
  return data || [];
}

export async function getGroomingShopById(id: string): Promise<GroomingShop | null> {
  const { data, error } = await supabase
    .from('grooming_shops')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`Grooming shop with ID ${id} not found.`);
      return null;
    }
    console.error(`Error fetching grooming shop with ID ${id}:`, error.message);
    throw error;
  }
  return data;
}