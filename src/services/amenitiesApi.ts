import { authHelper } from "../helpers/authHelper";

export async function fetchAmenities(serviceType: string) {
  const data = await authHelper.post("/api/amenities/servicetype", { serviceType });
  return data.properties;
}
