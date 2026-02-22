import { Router } from "express";
import { favoritesController } from "../controllers/favoritesController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
// console.log("router loaded"); // Debug log to confirm router is loaded

router.use(authMiddleware);
router.get("/", favoritesController.getUserFavorites);
router.post("/", favoritesController.addFavorite);
router.delete("/:property_id", favoritesController.removeFavorite);
router.get("/check/:property_id", favoritesController.checkFavorite);

export default router;