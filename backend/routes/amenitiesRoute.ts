import { Router } from "express";
import { amenitiesController } from "../controllers/amenitiesController";

const router = Router();

router.post("/servicetype", amenitiesController.getamenitiesByServiceType);

export default router;