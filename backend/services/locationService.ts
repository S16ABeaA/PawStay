export async function reverseGeocode(lat: any, lng: any) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "pet-app/1.0" // required by Nominatim
    }
  });

  return response.json();
}

export async function searchLocation(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=5&countrycodes=PH`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "pet-app/1.0",
    },
  });

  return response.json();
}