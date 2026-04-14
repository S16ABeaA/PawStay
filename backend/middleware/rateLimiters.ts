import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { createUpstashRateLimitStore } from "./upstashRateLimitStore";

type KeyGenerator = (req: Request) => string;

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const getIpKey: KeyGenerator = (req) => req.ip || req.socket.remoteAddress || "unknown";

const getUserOrIpKey: KeyGenerator = (req) => {
  const userId = (req as any).user?.id;
  if (userId) return `u:${String(userId)}`;
  return `ip:${getIpKey(req)}`;
};

const getEmailOrIpKey: KeyGenerator = (req) => {
  const email = String((req.body as any)?.email || "").trim().toLowerCase();
  if (email) return `e:${email}`;
  return `ip:${getIpKey(req)}`;
};

const createLimiter = ({
  prefix,
  windowMs,
  max,
  keyGenerator,
  message,
  skipSuccessfulRequests,
  skipFailedRequests,
}: {
  prefix: string;
  windowMs: number;
  max: number;
  keyGenerator: KeyGenerator;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) =>
  rateLimit({
    store: createUpstashRateLimitStore({ windowMs, prefix }),
    windowMs,
    max,
    keyGenerator,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req: Request, res: Response) => {
      const resetTime = (req as any).rateLimit?.resetTime;
      const resetMs = resetTime instanceof Date
        ? resetTime.getTime() - Date.now()
        : typeof resetTime === "number"
          ? resetTime - Date.now()
          : windowMs;

      const retryAfter = Math.max(1, Math.ceil(resetMs / 1000));

      res.status(429).json({
        error: "Too many requests",
        message,
        retryAfter,
      });
    },
  });

// Anonymous browsing/search
export const anonBrowseHourlyLimiter = createLimiter({
  prefix: "rl:anon:browse:1h",
  windowMs: ONE_HOUR,
  max: 300,
  keyGenerator: getIpKey,
  message: "Browsing limit reached. Please try again in about an hour.",
});

export const anonSearchHourlyLimiter = createLimiter({
  prefix: "rl:anon:search:1h",
  windowMs: ONE_HOUR,
  max: 100,
  keyGenerator: getIpKey,
  message: "Search limit reached. Please try again later.",
});

// Pre-auth guard for protected endpoints (throttles abuse before auth checks)
export const authGuardLimiter = createLimiter({
  prefix: "rl:guard:auth:1h",
  windowMs: ONE_HOUR,
  max: 600,
  keyGenerator: getIpKey,
  message: "Too many requests to protected endpoints. Please slow down.",
});

// Authenticated browsing/search
export const authBrowseHourlyLimiter = createLimiter({
  prefix: "rl:auth:browse:1h",
  windowMs: ONE_HOUR,
  max: 500,
  keyGenerator: getUserOrIpKey,
  message: "Request limit reached for this hour.",
});

export const authBrowseDailyLimiter = createLimiter({
  prefix: "rl:auth:browse:1d",
  windowMs: ONE_DAY,
  max: 5000,
  keyGenerator: getUserOrIpKey,
  message: "Daily request limit reached.",
});

// Authentication endpoints
export const loginLimiter = createLimiter({
  prefix: "rl:auth:login:15m",
  windowMs: 15 * ONE_MINUTE,
  max: 10,
  keyGenerator: getIpKey,
  message: "Too many login attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

export const registrationLimiter = createLimiter({
  prefix: "rl:auth:register:1h",
  windowMs: ONE_HOUR,
  max: 3,
  keyGenerator: getIpKey,
  message: "Too many registration attempts. Please try again later.",
});

export const resendVerificationLimiter = createLimiter({
  prefix: "rl:auth:resend:1h",
  windowMs: ONE_HOUR,
  max: 5,
  keyGenerator: getEmailOrIpKey,
  message: "Too many verification resends. Please try again later.",
});

export const passwordResetLimiter = createLimiter({
  prefix: "rl:auth:password-reset:1h",
  windowMs: ONE_HOUR,
  max: 3,
  keyGenerator: getEmailOrIpKey,
  message: "Too many password reset attempts for this account.",
});

// Profile + uploads
export const profileUpdateLimiter = createLimiter({
  prefix: "rl:profile:update:1h",
  windowMs: ONE_HOUR,
  max: 20,
  keyGenerator: getUserOrIpKey,
  message: "Profile update limit reached.",
});

export const photoUploadHourlyLimiter = createLimiter({
  prefix: "rl:upload:photo:1h",
  windowMs: ONE_HOUR,
  max: 50,
  keyGenerator: getUserOrIpKey,
  message: "Photo upload hourly limit reached.",
  skipFailedRequests: true,
});

export const photoUploadDailyLimiter = createLimiter({
  prefix: "rl:upload:photo:1d",
  windowMs: ONE_DAY,
  max: 200,
  keyGenerator: getUserOrIpKey,
  message: "Photo upload daily limit reached.",
  skipFailedRequests: true,
});

// Booking/payment critical paths
export const bookingConfirmationLimiter = createLimiter({
  prefix: "rl:booking:confirm:1h",
  windowMs: ONE_HOUR,
  max: 30,
  keyGenerator: getUserOrIpKey,
  message: "Booking confirmation limit reached for this hour.",
});

export const bookingOpsHourlyLimiter = createLimiter({
  prefix: "rl:booking:ops:1h",
  windowMs: ONE_HOUR,
  max: 50,
  keyGenerator: getUserOrIpKey,
  message: "Booking operation limit reached for this hour.",
});

export const paymentInitiationLimiter = createLimiter({
  prefix: "rl:payment:init:1h",
  windowMs: ONE_HOUR,
  max: 20,
  keyGenerator: getUserOrIpKey,
  message: "Payment operation limit reached for this hour.",
});

export const refundRequestLimiter = createLimiter({
  prefix: "rl:refund:req:1h",
  windowMs: ONE_HOUR,
  max: 10,
  keyGenerator: getUserOrIpKey,
  message: "Refund request limit reached for this hour.",
});

// Reviews/ratings
export const reviewsHourlyLimiter = createLimiter({
  prefix: "rl:reviews:1h",
  windowMs: ONE_HOUR,
  max: 10,
  keyGenerator: getUserOrIpKey,
  message: "Review limit reached for this hour.",
});

// Service provider dashboard + operations
export const calendarAccessLimiter = createLimiter({
  prefix: "rl:calendar:1h",
  windowMs: ONE_HOUR,
  max: 100,
  keyGenerator: getUserOrIpKey,
  message: "Calendar request limit reached for this hour.",
});

export const availabilityUpdateLimiter = createLimiter({
  prefix: "rl:availability:update:1h",
  windowMs: ONE_HOUR,
  max: 50,
  keyGenerator: getUserOrIpKey,
  message: "Availability update limit reached for this hour.",
});

export const serviceListingUpdateLimiter = createLimiter({
  prefix: "rl:service-listing:update:1h",
  windowMs: ONE_HOUR,
  max: 30,
  keyGenerator: getUserOrIpKey,
  message: "Service listing update limit reached for this hour.",
});

export const bulkOpsLimiter = createLimiter({
  prefix: "rl:bulk-ops:1h",
  windowMs: ONE_HOUR,
  max: 10,
  keyGenerator: getUserOrIpKey,
  message: "Bulk operation limit reached for this hour.",
});

// Messaging
export const messagingHourlyLimiter = createLimiter({
  prefix: "rl:messages:1h",
  windowMs: ONE_HOUR,
  max: 200,
  keyGenerator: getUserOrIpKey,
  message: "Messaging limit reached for this hour.",
});
