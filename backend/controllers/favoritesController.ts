import { Request, Response } from "express";
import { addFavorites, removeFavorites, getFavorites, checkFavorite } from "../services/favoriteService";
import { logger } from "../utils/logger";


export const favoritesController = {
  addFavorite: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { property_id } = req.body as { property_id: string };

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!property_id) {
        return res.status(400).json({ message: "property_id is required" });
      }

      await addFavorites(userId, property_id);

      return res.status(201).json({ message: "Favorite added successfully" });
    } catch (err: any) {
      // Handle duplicate favorite gracefully
      if (err?.code === "23505") {
        return res.status(409).json({ message: "Already in favorites" });
      }
      logger.error("[addFavorite]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  removeFavorite: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { property_id } = req.params as { property_id: string };

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!property_id) {
        return res.status(400).json({ message: "property_id is required" });
      }

      await removeFavorites(userId, property_id);

      return res.status(200).json({ message: "Favorite removed successfully" });
    } catch (err: any) {
      logger.error("[removeFavorite]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  getUserFavorites: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const favorites = await getFavorites(userId);

      return res.status(200).json({ favorites });
    } catch (err: any) {
      logger.error("[getFavorites]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  checkFavorite: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { property_id } = req.params as { property_id: string };

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isFavorited = await checkFavorite(userId, property_id);

      return res.status(200).json({ isFavorited });
    } catch (err: any) {
      logger.error("[checkFavorite]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
}