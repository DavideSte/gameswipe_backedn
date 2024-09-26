import { z } from "zod";

// login with username or email and password, but either username or email is required
export const loginValidation = z
  .object({
    username: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.username || data.email, {
    message: "Either 'username' or 'email' is required",
    path: ["username", "email"], // Specify the paths that should be validated
  });

// register with email, username and password
export const registerValidation = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const verifyTokenValidation = z.object({
  token: z.string(),
});
