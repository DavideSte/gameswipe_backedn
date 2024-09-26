import { Router } from "express";
import authRoutes from "./auth";
import gamesRoutes from "./games";
import userRoutes from "./users";
import friendsRoutes from "./friends";
import { requiresAuth } from "../middlewares/requiresAuth";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", requiresAuth, userRoutes);
router.use("/games", requiresAuth, gamesRoutes);
router.use("/friends", requiresAuth, friendsRoutes);

export default router;
