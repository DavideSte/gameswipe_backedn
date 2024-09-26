import { env } from "../config/env";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { IAccessTokenContent, IRefreshTokenContent } from "types/tokenTypes";

export const random = () => crypto.randomBytes(128).toString("base64");

export const generateSaltedPassword = (salt: string, password: string) => {
  return crypto
    .createHmac("sha256", [salt, password].join("/"))
    .update(env.SECRET_KEY)
    .digest("hex");
};

export const encryptWithSecret = (value: string) => {
  return crypto.createHmac("sha256", value).update(env.SECRET_KEY).digest("hex");
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRATION / 1000,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRATION / 1000,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as IAccessTokenContent;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as IRefreshTokenContent;
};
