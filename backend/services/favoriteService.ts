import { favoriteModel } from "../models/favoritesModel";

export async function addFavorites(userId: string, property_id: string | number) {
  if (!userId) throw new Error("User not authenticated");

  const data = await favoriteModel.create({
    user_id: userId,
    property_id,
  });

  return data;
}

export async function removeFavorites(userId: string, property_id: string | number) {
  if (!userId) throw new Error("User not authenticated");

  await favoriteModel.delete(userId, property_id);

  return { success: true };
}

export async function getFavorites(userId: string) {
  if (!userId) throw new Error("User not authenticated");

  const favorites = await favoriteModel.findByUser(userId);

  return favorites;
}

export async function checkFavorite(userId: string, property_id: string | number) {
  if (!userId) throw new Error("User not authenticated");

  return favoriteModel.exists(userId, property_id);
}