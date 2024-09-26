import {
  loginValidation,
  registerValidation,
  verifyTokenValidation,
} from "../routes/validationSchema/authValidation";
import { asyncWrapper } from "../middlewares/asyncWrapper";
import { Request, Response } from "express";
import {
  db_createUser,
  db_getUserByEmail,
  db_getUserById,
  db_getUserByUsername,
  db_getUserByVerificationToken,
  db_getUserRefreshTokensById,
  IRefreshToken,
  IUser,
} from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSaltedPassword,
  random,
  verifyRefreshToken,
} from "../utils";
import crypto from "crypto";
import { env } from "../config/env";
import sgMail from "@sendgrid/mail";
import { v4 as uuidv4 } from "uuid";

//#region Auth Controllers
export const register = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password, username } = registerValidation.parse(req.body);

  // check if user exists
  const userExists = await db_getUserByEmail(email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // create a salted password hash
  const salt = random();
  const saltedPassword = generateSaltedPassword(password, salt);

  // create token for email verification
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user: IUser = {
    email,
    username,
    authentication: {
      password: saltedPassword,
      salt,
    },
    verificationToken,
  };

  // create user
  const createdUser = await db_createUser(user);
  if (!createdUser) {
    return res.status(500).json({ message: "Error creating user" });
  }

  // Send verification email
  const emailSent = await sendVerificationEmail(email, verificationToken);
  if (!emailSent) {
    return res.status(500).json({ message: "Error sending verification email." });
  }

  return res.status(201).json({ message: "User created. Please verify your email." });
});

export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { token } = verifyTokenValidation.parse(req.params);
  if (!token) {
    return res.status(400).json({ message: "Token is missing." });
  }

  const user = await db_getUserByVerificationToken(token);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // remove verification token from user
  user.verificationToken = undefined;
  await user.save();

  // generate token and set cookies
  const userId = user._id.toString();
  const refreshToken = await getRefreshToken(userId);
  const accessToken = generateAccessToken(userId);

  if (!refreshToken) {
    return res.status(500).json({ message: "Error creating refresh token" });
  }

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken.token);
  setSessionIdCookie(res, refreshToken.sessionId);

  return res
    .status(200)
    .json({ message: "Email verified", user: { email: user.email, username: user.username } });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { email, username, password } = loginValidation.parse(req.body);

  const user = email
    ? await db_getUserByEmail(email)
    : username
    ? await db_getUserByUsername(username)
    : null;
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const saltedPassword = generateSaltedPassword(password, user.authentication!.salt!);
  if (saltedPassword !== user.authentication!.password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const userId = user._id.toString();

  const refreshToken = await getRefreshToken(userId, req.cookies.sessionId);
  if (!refreshToken) {
    return res.status(500).json({ message: "Error creating refresh token" });
  }

  const accessToken = generateAccessToken(user._id.toString());

  // set cookies
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken.token);
  setSessionIdCookie(res, refreshToken.sessionId);

  // send email and username to the client
  return res
    .status(200)
    .json({ message: "Logged in", user: { email: user.email, username: user.username } });
});

export const logout = (req: Request, res: Response) => {
  // once here, cookies are cleaned by the clearAllCookies middleware
  return res.status(200).json({ message: "Logged out" });
};

export const isLoggedIn = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;

  // load username, email from user
  const user = await db_getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res
    .status(200)
    .json({ message: "User is logged in", user: { email: user.email, username: user.username } });
});

export const refreshToken = asyncWrapper(async (req: Request, res: Response) => {
  const { refreshToken, sessionId } = req.cookies;
  if (!refreshToken || !sessionId) {
    return res.status(400).json({ message: "Refresh token or session ID is missing." });
  }

  const decodedRefreshToken = verifyRefreshToken(refreshToken);
  if (!decodedRefreshToken) {
    return res.status(400).json({ message: "Invalid refresh token." });
  }

  const userId = decodedRefreshToken.userId;

  const user = await db_getUserRefreshTokensById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // check if user has a corresponding refresh token that is not expired
  const currentDate = new Date(Date.now());
  const validRefreshToken = user.refreshTokens?.find(
    (token) =>
      token.token === refreshToken &&
      token.sessionId === sessionId &&
      token.expiryDate > currentDate
  );
  if (!validRefreshToken) {
    return res.status(400).json({ message: "Invalid refresh token." });
  }

  // generate new access token
  const newAccessToken = generateAccessToken(user._id.toString());
  setAccessTokenCookie(res, newAccessToken);

  return res.status(200).json({
    message: "Access token refreshed",
    user: { email: user.email, username: user.username },
  });
});

//#endregion

//#region Helper functions
const sendVerificationEmail = async (email: string, verificationToken: string) => {
  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const htmlContent = `
    Hey ${email},<br><br>
    Please verify your email address by following the link below.<br><br>
    <a href="${env.FRONTEND_URL}/auth/verify?token=${encodeURIComponent(
    verificationToken
  )}">Confirm your email</a><br><br>
    Your email address won't be updated until you verify it.<br><br><br>
    — ${env.APP_NAME} Team
  `;

  const msg = {
    from: env.EMAIL_SENDER,
    to: email,
    subject: "Verify your Email",
    html: htmlContent,
  };

  try {
    const [response] = await sgMail.send(msg);
    return response.statusCode === 202;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// set access token cookie
function setAccessTokenCookie(res: Response, accessToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: env.ACCESS_TOKEN_EXPIRATION,
  });
}

// set refresh token cookie
function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api/auth/refresh-token",
    maxAge: env.REFRESH_TOKEN_EXPIRATION, // shoud calculate the time remaining instead of setting a fixed value
  });
}

// set session id cookie
function setSessionIdCookie(res: Response, sessionId: string) {
  res.cookie("sessionId", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}

// retrieve refresh token from the database if it exists and is valid or create a new one
async function getRefreshToken(userId: string, sessionId?: string): Promise<IRefreshToken | null> {
  const user = await db_getUserRefreshTokensById(userId);
  if (!user) {
    return null;
  }

  const currentDate = new Date();

  // check if there a refresh token for the current session that is not expired
  const validRefreshToken = user.refreshTokens?.find(
    (token) => token.sessionId === sessionId && token.expiryDate > currentDate
  );
  if (validRefreshToken) {
    return validRefreshToken;
  }
  // if there is no valid refresh token, create a new one
  const newRefreshToken: IRefreshToken = {
    token: generateRefreshToken(userId),
    expiryDate: new Date(currentDate.getTime() + env.REFRESH_TOKEN_EXPIRATION),
    sessionId: uuidv4(),
  };

  // add the new refresh token to the user
  user.refreshTokens?.push(newRefreshToken);
  await user.save();

  return newRefreshToken;
}

//#endregion
