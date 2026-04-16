export async function reverseGeocode(lat: number, lng: number) {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
  const res = await fetch(`${API_BASE_URL}/api/location/reverse?lat=${lat}&lng=${lng}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch location");

  const data = await res.json();

  const sanitizeText = (value: unknown): string => {
    const text = String(value ?? "").trim();
    const lowered = text.toLowerCase();
    if (!text || lowered === "undefined" || lowered === "null") return "";
    return text;
  };

  return (
    sanitizeText(data?.city) ||
    sanitizeText(data?.displayName) ||
    sanitizeText(data?.address) ||
    ""
  );
}
