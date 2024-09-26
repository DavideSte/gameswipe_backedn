import { z } from "zod";

export const searchUsersValidation = z.object({
  q: z.string(),
});
