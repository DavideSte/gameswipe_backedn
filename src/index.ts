import { initializeTwitchAccessToken } from "./utils";
import { env } from "./config/env";
import mongoose from "mongoose";
import createServer from "./utils/server";

initializeTwitchAccessToken();

const app = createServer();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on https://localhost:${env.PORT}`);
});

const uri = env.MONGODB_URI;

mongoose
  .connect(uri)
  .then(() => console.log("Mongo DB connected."))
  .catch((error) => console.error("MongoDB connection error:", error));

export default app;
