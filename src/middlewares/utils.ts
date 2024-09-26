import { Request, Response, NextFunction } from "express";

export const clearAllCookies = (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.cookies;
  clearCookies(res, cookies);
  next();
};

export function clearCookies(res: Response, cookies: Record<string, any>) {
  for (const cookieName in cookies) {
    if (cookies.hasOwnProperty(cookieName)) {
      res.clearCookie(cookieName, { path: "/" });
    }
  }
  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh-token",
  });
}
