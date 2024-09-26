import { z } from "zod";

export const friendIdValidation = z.object({
  friendId: z.string(),
});

export const updateFriendshipValidation = z.object({
  friendshipId: z.string(),
});
