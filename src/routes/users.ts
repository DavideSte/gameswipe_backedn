import {
  addGameToUser,
  getAllGamesFromUser,
  getFriends,
  searchUsers,
} from "../controllers/usersController";
import { Router } from "express";
import { validateBody, validateQuery } from "../middlewares/validate";
import {
  addGameToUserValidation,
  getUserGamesValidation,
} from "./validationSchema/gamesValidation";
import { searchUsersValidation } from "./validationSchema/usersValidation";

// base url: /users
const router = Router();

// get users by email or username
router.get("", validateQuery(searchUsersValidation), searchUsers);

// add games as played, liked, disliked or non-played in user
router.post("/me/games", validateBody(addGameToUserValidation), addGameToUser);

// // get all games from user
router.get("/me/games", validateQuery(getUserGamesValidation), getAllGamesFromUser);

// get all the user friends
router.get("/me/friends", getFriends);

export default router;
