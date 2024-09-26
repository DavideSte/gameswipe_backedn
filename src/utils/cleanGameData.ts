import { Game } from "../types/IGDBTypes";
import { z } from "zod";

export default function cleanGameData(games: { [key: string]: unknown }[]): Game[] {
  const gamesList = <Game[]>[];
  games.forEach((game) => {
    try {
      gamesList.push(GameSchema.parse(game));
    } catch (error) {
      console.error(error);
    }
  });
  return gamesList;
}

export const PropertySchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
});

export const GameSchema = z.object({
  id: z.number(),
  artworks: z.array(
    z.object({
      id: z.coerce.string(),
      image_id: z.string(),
    })
  ),
  category: z.number(),
  first_release_date: z.number(),
  franchise: PropertySchema.optional(),
  genres: z.array(PropertySchema),
  keywords: z.array(PropertySchema).optional(),
  name: z.string(),
  total_rating: z.number(),
  total_rating_count: z.number(),
});
