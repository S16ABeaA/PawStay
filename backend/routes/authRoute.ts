import { Router } from "express";
import multer from "multer";
import { authController } from "../controllers/authController";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import {
  authGuardLimiter,
  bulkOpsLimiter,
  loginLimiter,
  oauthLimiter,
  passwordResetLimiter,
  photoUploadDailyLimiter,
  photoUploadHourlyLimiter,
  profileUpdateLimiter,
  registrationLimiter,
  resendVerificationLimiter,
} from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const namePattern = /^[a-zA-Z][a-zA-Z\s'\-]{0,49}$/;

const signUpSchema = {
  email: { type: "email", required: true, maxLength: 254 },
  password: { type: "string", required: true, minLength: 8, maxLength: 128, sanitize: false },
  firstName: { type: "string", required: true, minLength: 1, maxLength: 50, pattern: namePattern },
  lastName: { type: "string", required: true, minLength: 1, maxLength: 50, pattern: namePattern },
  isPartner: { type: "boolean", required: false },
} as const;

const signInSchema = {
  email: { type: "email", required: true, maxLength: 254 },
  password: { type: "string", required: true, minLength: 1, maxLength: 128, sanitize: false },
} as const;

const emailOnlySchema = {
  email: { type: "email", required: true, maxLength: 254 },
} as const;

const updateProfileSchema = {
  firstName: { type: "string", required: false, minLength: 1, maxLength: 50, pattern: namePattern },
  lastName: { type: "string", required: false, minLength: 1, maxLength: 50, pattern: namePattern },
  phone: { type: "string", required: false, minLength: 7, maxLength: 20, pattern: /^[+0-9\-()\s]{7,20}$/ },
  address: { type: "string", required: false, minLength: 3, maxLength: 200 },
} as const;

const authUserIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const promoteSchema = {
  user_id: { type: "uuid", required: true },
  role: { type: "enum", required: true, enumValues: ["customer", "proprietor", "admin", "super_admin"] },
} as const;

const banSchema = {
  banned: { type: "boolean", required: true },
} as const;

const normalizePromoteBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  next();
};

const resolvePromoteUserId = async (req: any, _res: any, next: any) => {
  try {
    req.body = req.body || {};
    if (req.body.user_id) return next();
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return next();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("is_deleted", false)
      .maybeSingle();

    if (profile?.id) {
      req.body.user_id = profile.id;
    }
    return next();
  } catch {
    return next();
  }
};

const normalizeBanBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  if (req.body.banned === undefined && req.body.ban !== undefined) {
    req.body.banned = req.body.ban;
  }
  if (req.body.ban === undefined && req.body.banned !== undefined) {
    req.body.ban = req.body.banned;
  }
  next();
};

router.post("/signUp", registrationLimiter, validateBody(signUpSchema), authController.signUp);
router.post("/resendConfirmation", resendVerificationLimiter, validateBody(emailOnlySchema), authController.resendConfirmation);
router.post("/signIn", loginLimiter, validateBody(signInSchema), authController.signIn);
router.get("/signInWithGoogle", oauthLimiter, authController.signInWithGoogle);
router.get("/oauth/callback", oauthLimiter, authController.oauthCallback); // Google OAuth callback
router.post("/forgotPassword", passwordResetLimiter, validateBody(emailOnlySchema), authController.forgotPassword);
router.get("/profile", authGuardLimiter, authMiddleware, authController.getProfile); // Get current user
router.put("/updateProfile", authGuardLimiter, authMiddleware, profileUpdateLimiter, validateBody(updateProfileSchema), authController.updateProfile);
router.post(
  "/uploadAvatar",
  authGuardLimiter,
  authMiddleware,
  photoUploadHourlyLimiter,
  photoUploadDailyLimiter,
  upload.single("avatar"),
  authController.uploadAvatar
);
router.post("/signOut", authGuardLimiter, authMiddleware, authController.signOut);
router.post(
  "/promote",
  authGuardLimiter,
  authMiddleware,
  requireSuperAdmin,
  bulkOpsLimiter,
  resolvePromoteUserId,
  normalizePromoteBody,
  validateBody(promoteSchema, { allowUnknown: true }),
  authController.promoteUser
);
router.get("/users", authGuardLimiter, authMiddleware, requireSuperAdmin, authController.listUsers);
router.patch(
  "/users/:id/ban",
  authGuardLimiter,
  authMiddleware,
  requireSuperAdmin,
  bulkOpsLimiter,
  normalizeBanBody,
  validateParams(authUserIdParamSchema),
  validateBody(banSchema, { allowUnknown: true }),
  authController.banUser
);
router.delete(
  "/users/:id",
  authGuardLimiter,
  authMiddleware,
  requireSuperAdmin,
  bulkOpsLimiter,
  validateParams(authUserIdParamSchema),
  authController.deleteUser
);

export default router;