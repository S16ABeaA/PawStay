import { createContext, useContext } from "react";

export interface AdminProperty {
  id: string;
  name: string;
  property_type?: string[];
  address?: string;
  city?: string;
  cover_image?: string | null;
  status?: string;
}

interface AdminPropertyContextValue {
  properties: AdminProperty[];
  selectedPropertyId: string | null;
  selectedProperty: AdminProperty | null;
  setSelectedPropertyId: (id: string) => void;
  loading: boolean;
  refreshProperties: () => Promise<void>;
}

export const AdminPropertyContext = createContext<AdminPropertyContextValue | null>(null);

export function useAdminProperty() {
  const ctx = useContext(AdminPropertyContext);
  if (!ctx) {
    throw new Error("useAdminProperty must be used within AdminPropertyProvider");
  }
  return ctx;
}
