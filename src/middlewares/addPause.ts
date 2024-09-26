import { Request, Response, NextFunction } from "express";
import pause from "../utils/pause";

export const addPause = async (req: Request, res: Response, next: NextFunction) => {
  await pause(200);
  next();
};
