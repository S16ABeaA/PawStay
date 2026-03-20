import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  getPetServiceHistoryInsights,
} from "../controllers/petController";

const router = Router();

// All pet routes require authentication
router.use(authMiddleware);

router.get("/", listPets);
router.get("/:id/service-history/insights", getPetServiceHistoryInsights);
router.get("/:id", getPet);
router.post("/", createPet);
router.put("/:id", updatePet);
router.delete("/:id", deletePet);

export default router;
