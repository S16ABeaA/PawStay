import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { authBrowseHourlyLimiter, bookingOpsHourlyLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";
import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  getPetServiceHistoryInsights,
} from "../controllers/petController";

const router = Router();

const petIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const petCreateSchema = {
  name: { type: "string", required: true, minLength: 1, maxLength: 80 },
  species: { type: "string", required: true, minLength: 1, maxLength: 40 },
  breed: { type: "string", required: false, maxLength: 80 },
  birthday: { type: "string", required: true, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
  weight: { type: "number", required: true, min: 0, max: 500 },
  photo_url: { type: "string", required: false, maxLength: 10000 },
  notes: { type: "string", required: false, maxLength: 2000 },
} as const;

const petUpdateSchema = {
  name: { type: "string", required: false, minLength: 1, maxLength: 80 },
  species: { type: "string", required: false, minLength: 1, maxLength: 40 },
  breed: { type: "string", required: false, maxLength: 80 },
  birthday: { type: "string", required: false, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
  weight: { type: "number", required: false, min: 0, max: 500 },
  photo_url: { type: "string", required: false, maxLength: 10000 },
  notes: { type: "string", required: false, maxLength: 2000 },
} as const;

// All pet routes require authentication
router.use(authMiddleware);

router.get("/", authBrowseHourlyLimiter, authMiddleware, listPets);
router.get("/:id/service-history/insights", authBrowseHourlyLimiter, validateParams(petIdParamSchema), getPetServiceHistoryInsights);
router.get("/:id", authBrowseHourlyLimiter, authMiddleware, validateParams(petIdParamSchema), getPet);
router.post("/", bookingOpsHourlyLimiter, validateBody(petCreateSchema), createPet);
router.put("/:id", bookingOpsHourlyLimiter, validateParams(petIdParamSchema), validateBody(petUpdateSchema), updatePet);
router.delete("/:id", bookingOpsHourlyLimiter, validateParams(petIdParamSchema), deletePet);

export default router;
