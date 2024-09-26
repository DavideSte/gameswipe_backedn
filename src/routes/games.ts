import { Router } from "express";
import { validateQuery } from "../middlewares/validate";
import { gamesValidation } from "./validationSchema/gamesValidation";
import { getGames } from "../controllers/gamesController";
import { requiresAuth } from "../middlewares/requiresAuth";

// base url: /games
const router = Router();

// get all games filterd
router.get("", requiresAuth, validateQuery(gamesValidation), getGames);

export default router;
