import { ReactNode, useCallback, useEffect, useState } from "react";
import { authHelper } from "@/helpers/authHelper";
import { AdminProperty, AdminPropertyContext } from "@/hooks/useAdminProperty";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const STORAGE_KEY = "pawstay_selected_property";

const isPropertySelectable = (property: AdminProperty) => property.status === "approved";

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

      const stored = localStorage.getItem(STORAGE_KEY);
      const selectableProps = props.filter(isPropertySelectable);

      if (selectableProps.length > 0) {
        const valid = selectableProps.some((p) => p.id === stored);
        if (!valid) {
          const first = selectableProps[0].id;
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
