import { db_getUserById } from "../models/User";
import { verifyAccessToken } from "../utils";
import { Request, Response, NextFunction } from "express";

export const requiresAuth = (req: Request, res: Response, next: NextFunction) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyAccessToken(accessToken) as { userId: string };
    const decodedId = decoded.userId;

    // check if user exists
    const user = db_getUserById(decodedId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.userId = decodedId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token." });
  }
};
