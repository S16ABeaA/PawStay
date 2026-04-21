import { Router } from "express";
import { Redis } from "@upstash/redis";
import { amenitiesController } from "../controllers/amenitiesController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { anonSearchHourlyLimiter, authBrowseHourlyLimiter, bulkOpsLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";
import { logger } from "../utils/logger";

const router = Router();
const redis = Redis.fromEnv();
const CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours — reduces simultaneous expiry spikes

const amenityIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const serviceTypeSchema = {
  serviceType: { type: "string", required: true, maxLength: 40, pattern: /^[a-zA-Z\s_-]+$/ },
} as const;

const amenityCreateSchema = {
  amenity: { type: "string", required: true, minLength: 1, maxLength: 120 },
  category: { type: "string", required: false, maxLength: 80 },
  service_types: { type: "string[]", required: false, maxItems: 20, maxLength: 40 },
  is_active: { type: "boolean", required: false },
} as const;

const amenityUpdateSchema = {
  amenity: { type: "string", required: false, minLength: 1, maxLength: 120 },
  category: { type: "string", required: false, maxLength: 80 },
  service_types: { type: "string[]", required: false, maxItems: 20, maxLength: 40 },
  is_active: { type: "boolean", required: false },
} as const;

// ✅ Cache FIRST — cached responses skip the rate limiter entirely
const amenitiesServiceTypeCache = async (req: any, res: any, next: any) => {
  try {
    const serviceType = String(req.body?.serviceType || "").trim().toLowerCase();
    if (!serviceType) return next();

    const cacheKey = `cache:amenities:servicetype:${serviceType}`;
    const cached = await redis.get(cacheKey);

    // Return cached response — rate limiter never runs for this request
    if (cached) return res.status(200).json(cached);

    // Not cached — intercept response to store it
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.set(cacheKey, body, { ex: CACHE_TTL_SECONDS }).catch((err) => {
          logger.warn("[amenities cache] set failed", err);
        });
      }
      return originalJson(body);
    };
    return next();
  } catch (err) {
    logger.warn("[amenities cache] middleware failed", err);
    return next();
  }
};

// ✅ Invalidate ONLY on successful mutation response
const invalidateAmenitiesCacheOnSuccess = (req: any, res: any, next: any) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      redis.keys("cache:amenities:servicetype:*")
        .then((keys) => {
          if (keys.length > 0) return redis.del(...keys);
        })
        .catch((err) => logger.warn("[amenities cache] invalidation failed", err));
    }
    return originalJson(body);
  };
  next();
};

// ─── Public ───────────────────────────────────────────────
// Cache first → rate limit → validate → controller
// Cached responses never consume rate limit quota
router.post(
  "/servicetype",
  amenitiesServiceTypeCache,       // ✅ cache first
  anonSearchHourlyLimiter,         // only runs on cache miss
  validateBody(serviceTypeSchema),
  amenitiesController.getamenitiesByServiceType
);

// ─── Admin CRUD ───────────────────────────────────────────
// limiter → auth → invalidate on success → validate → controller
router.get(
  "/",
  authBrowseHourlyLimiter,
  authMiddleware,
  requireSuperAdmin,
  amenitiesController.listAmenities
);

router.post(
  "/",
  bulkOpsLimiter,
  authMiddleware,
  requireSuperAdmin,
  validateBody(amenityCreateSchema),
  invalidateAmenitiesCacheOnSuccess, // ✅ only invalidates on 2xx
  amenitiesController.createAmenity
);

router.put(
  "/:id",
  bulkOpsLimiter,
  authMiddleware,
  requireSuperAdmin,
  validateParams(amenityIdParamSchema),
  validateBody(amenityUpdateSchema),
  invalidateAmenitiesCacheOnSuccess, // ✅ only invalidates on 2xx
  amenitiesController.updateAmenity
);

router.delete(
  "/:id",
  bulkOpsLimiter,
  authMiddleware,
  requireSuperAdmin,
  validateParams(amenityIdParamSchema),
  invalidateAmenitiesCacheOnSuccess, // ✅ only invalidates on 2xx
  amenitiesController.deleteAmenity
);

export default router;