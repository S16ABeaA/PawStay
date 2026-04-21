import express from "express";
import { reverseGeocode, searchLocation } from "../services/locationService";
import { anonBrowseHourlyLimiter, anonSearchHourlyLimiter } from "../middleware/rateLimiters";
import { validateQuery } from "../middleware/inputValidation";
const router = express.Router();

const reverseQuerySchema = {
  lat: { type: "number", required: true, min: -90, max: 90 },
  lng: { type: "number", required: true, min: -180, max: 180 },
} as const;

const searchQuerySchema = {
  q: { type: "string", required: true, minLength: 1, maxLength: 120, pattern: /^[a-zA-Z0-9\s,.'\-]*$/ },
} as const;

router.get("/reverse", anonBrowseHourlyLimiter, validateQuery(reverseQuerySchema), async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const data = await reverseGeocode(lat, lng);

    const city =
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      data.address.village;

    res.status(200).json({ city: `${city}`, displayName: data.display_name });
  } catch (err: any) {
    res.status(500).json({ message: "Reverse geocoding failed" });
  }
});

router.get("/search", anonSearchHourlyLimiter, validateQuery(searchQuerySchema), async (req, res) => {
  const query = String(req.query.q || "").trim();

  try {
    const data = await searchLocation(query);

    // Extract city-level names and deduplicate
    const getCityName = (item: any) => {
      const address = item?.address ?? {};
      return (
        address.city ||
        address.town ||
        address.municipality ||
        address.village ||
        address.hamlet ||
        ""
      );
    };

    const locs = data.reduce((acc: any[], item: any) => {
      const cityName = getCityName(item);
      if (!cityName) return acc;
      acc.push({
        name: cityName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      });
      return acc;
    }, []);

    // Deduplicate by city name
    const unique = Array.from(
      new Map(locs.map((loc: any) => [loc.name.toLowerCase(), loc])).values()
    );

    res.status(200).json({ locations: unique });
  } catch (err: any) {
    res.status(500).json({ message: "Location search failed" });
  }
});

export default router;