import * as z from "zod";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";

dotenv.config({ path: path.join(__dirname, `../../${envFile}`) });

const createEnv = () => {
  const envSchema = z.object({
    APP_NAME: z.string(),
    SECRET_KEY: z.string(),
    PORT: z.coerce.number(),
    API_URL: z.string(),
    ACCESS_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRATION: z.coerce.number(),
    REFRESH_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_EXPIRATION: z.coerce.number(),
    TWITCH_CLIENT_ID: z.string(),
    TWITCH_CLIENT_SECRET: z.string(),
    IGDB_URL: z.string(),
    SENDGRID_API_KEY: z.string(),
    FRONTEND_URL: z.string(),
    MONGODB_URI: z.string(),
    EMAIL_SENDER: z.string().email(),
  });

  const parsedEnv = envSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    console.error(parsedEnv.error.errors);
    throw new Error("error parsing env");
  }

  return parsedEnv.data;
};

export const env = createEnv();
