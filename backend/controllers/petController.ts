import { Request, Response } from "express";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";

/** GET /api/pets — list current user's pets (with service history) */
export const listPets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const pets = await petModel.getByOwner(userId);

    // Attach service history to each pet
    const petsWithHistory = await Promise.all(
      pets.map(async (pet) => {
        try {
          const history = await serviceHistoryModel.getByPet(pet.id);
          return {
            ...pet,
            serviceHistory: history.map((h) => ({
              id: h.id,
              type: h.service_type as "grooming" | "checkup",
              serviceName: h.service_name,
              date: h.performed_at,
              notes: h.notes,
            })),
          };
        } catch {
          return { ...pet, serviceHistory: [] };
        }
      })
    );

    return res.json({ pets: petsWithHistory });
  } catch (err: any) {
    console.error("listPets error:", err);
    return res.status(500).json({ error: "Failed to fetch pets." });
  }
};

/** GET /api/pets/:id — get one pet (must belong to user) */
export const getPet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const pet = await petModel.getById(req.params.id as string, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found." });

    return res.json({ pet });
  } catch (err: any) {
    console.error("getPet error:", err);
    return res.status(500).json({ error: "Failed to fetch pet." });
  }
};

/** POST /api/pets — create a new pet */
export const createPet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, species, breed, birthday, weight, photo_url, notes } = req.body;

    if (!name || !species || !birthday || weight == null) {
      return res.status(400).json({ error: "Missing required fields: name, species, birthday, weight." });
    }

    const pet = await petModel.create(userId, {
      name,
      species,
      breed: breed || "",
      birthday,
      weight: parseFloat(weight),
      photo_url: photo_url || null,
      notes: notes || null,
    });

    return res.status(201).json({ pet });
  } catch (err: any) {
    console.error("createPet error:", err);
    return res.status(500).json({ error: "Failed to create pet.", details: err?.message || err });
  }
};

/** PUT /api/pets/:id — update a pet */
export const updatePet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, species, breed, birthday, weight, photo_url, notes } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (species !== undefined) updates.species = species;
    if (breed !== undefined) updates.breed = breed;
    if (birthday !== undefined) updates.birthday = birthday;
    if (weight !== undefined) updates.weight = parseFloat(weight);
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (notes !== undefined) updates.notes = notes;

    const pet = await petModel.update(req.params.id as string, userId, updates);
    return res.json({ pet });
  } catch (err: any) {
    console.error("updatePet error:", err);
    return res.status(500).json({ error: "Failed to update pet." });
  }
};

/** DELETE /api/pets/:id — soft-delete a pet */
export const deletePet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await petModel.softDelete(req.params.id as string, userId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deletePet error:", err);
    return res.status(500).json({ error: "Failed to delete pet." });
  }
};
