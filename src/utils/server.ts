import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "../middlewares/errorHandler";
import morgan from "morgan";
import routes from "../routes";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import https from "https";
import fs from "fs";
import { env } from "../config/env";

const httpsOptions = {
  key: fs.readFileSync(`./cert/localhost-key.pem`),
  cert: fs.readFileSync(`./cert/localhost.pem`),
};

function createServer() {
  const app = express();
  const appName = env.APP_NAME;

  // Middleware
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true, // Allow cookies to be sent and received
    })
  );
  app.use(morgan("combined"));

  // Custom middleware
  app.use(errorHandler);

  // Routes
  app.use("/api", routes);

  return https.createServer(httpsOptions, app);
}

export default createServer;
