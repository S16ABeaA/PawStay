const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(`${API_BASE_URL}/api/location/reverse?lat=${lat}&lng=${lng}`);

  if (!res.ok) throw new Error("Failed to fetch latlongtoCity");

  const data = await res.json();
  return data.city || data.displayName;
}
