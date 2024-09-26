import { z } from "zod";

export const gamesValidation = z.object({
  page: z.coerce.number().int().optional(),
  console: z.string().optional(),
  genre: z.string().optional(),
  company: z.string().optional(),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
});

export const gameIdValidation = z.object({
  gameId: z.coerce.number().int(),
});

export const addGameToUserValidation = z.object({
  gameId: z.coerce.number().int(),
  status: z.enum(["played", "liked", "disliked", "non-played"]),
});

export const getUserGamesValidation = z
  .object({
    gamesIds: z.array(z.coerce.number().int()).optional(),
  })
  .partial();
