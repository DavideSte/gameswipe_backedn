import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate";
import {
  loginValidation,
  registerValidation,
  verifyTokenValidation,
} from "./validationSchema/authValidation";
import {
  isLoggedIn,
  login,
  logout,
  refreshToken,
  register,
  verifyEmail,
} from "../controllers/authController";
import { requiresAuth } from "../middlewares/requiresAuth";
import { clearAllCookies } from "../middlewares/utils";

// base url: /auth
const router = Router();

// login
router.post("/login", validateBody(loginValidation), login);

// register
router.post("/register", validateBody(registerValidation), register);

// verify email
router.get("/verify-email/:token", validateParams(verifyTokenValidation), verifyEmail);

// logout
router.post("/logout", clearAllCookies, logout);

// check if access token is valid
router.get("/is-logged-in", requiresAuth, isLoggedIn);

// refresh token
router.post("/refresh-token", refreshToken);

export default router;
