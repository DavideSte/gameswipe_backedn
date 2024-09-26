import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate";
import {
  friendIdValidation,
  updateFriendshipValidation,
} from "./validationSchema/friendsValidation";
import {
  acceptFriendship,
  createFriendship,
  getFriendGamesData,
} from "../controllers/friendsController";

// base url: /friends
const router = Router();

// create friendship
router.post("", validateBody(friendIdValidation), createFriendship);

// update pending friendship as accepted
router.put("/:friendshipId/accept", validateParams(updateFriendshipValidation), acceptFriendship);

// get friend games data
router.get("/:friendId/", validateParams(friendIdValidation), getFriendGamesData);

export default router;
