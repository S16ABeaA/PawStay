import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const STORAGE_KEY = "pawstay_selected_property";

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

const AdminPropertyContext = createContext<AdminPropertyContextValue | null>(null);

export function AdminPropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authHelper.get(`${API_BASE_URL}/api/properties/mine`);
      const props: AdminProperty[] = (data.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        property_type: p.property_type,
        address: p.address,
        city: p.city,
        cover_image: p.cover_image,
        status: p.status,
      }));
      setProperties(props);

      // If the previously selected property is no longer in the list, reset to first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (props.length > 0) {
        const valid = props.some((p) => p.id === stored);
        if (!valid) {
          const first = props[0].id;
          localStorage.setItem(STORAGE_KEY, first);
          setSelectedPropertyIdState(first);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setSelectedPropertyIdState(null);
      }
    } catch (err) {
      console.error("Failed to fetch properties for admin context", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const setSelectedPropertyId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setSelectedPropertyIdState(id);
  }, []);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) ?? null;

  return (
    <AdminPropertyContext.Provider
      value={{
        properties,
        selectedPropertyId,
        selectedProperty,
        setSelectedPropertyId,
        loading,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </AdminPropertyContext.Provider>
  );
}

export function useAdminProperty() {
  const ctx = useContext(AdminPropertyContext);
  if (!ctx) {
    throw new Error("useAdminProperty must be used within AdminPropertyProvider");
  }
  return ctx;
}
