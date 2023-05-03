import dotenv from "dotenv";
import express from "express";
import payload from "payload";
import admin from "./admin";
import openai from "./openai";
import path from "path";

dotenv.config();

const AIEXPRESS_API_KEY = process.env.AIEXPRESS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MONGO_URL =
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  "mongodb://0.0.0.0/payload";
const SERVER_URL = process.env.EXTERNAL_HOSTNAME
  ? `https://${process.env.EXTERNAL_HOSTNAME}`
  : `http://0.0.0.0:${process.env.PORT || 3000}`;

if (!AIEXPRESS_API_KEY) {
  throw new Error(
    "AI Express API key not set. Please set the AIEXPRESS_API_KEY environment variable."
  );
}

if (!OPENAI_API_KEY) {
  throw new Error(
    "OpenAI API key not set. Please set the OPENAI_API_KEY environment variable."
  );
}

const app = express();

app.get("/", (_, res) => {
  res.redirect("/admin");
});

app.get("/health", (_, res) => {
  res.sendStatus(200);
});

const start = async () => {
  app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

  await payload.init({
    secret: AIEXPRESS_API_KEY,
    mongoURL: MONGO_URL,
    express: app,
    onInit: async () => {
      payload.logger.info(
        `AI Express server successfully started. Get started by adding a new prompt at ${SERVER_URL}.`
      );
    },
  });

  app.use(express.json());
  app.post("/update-routes", async (req, res) => {
    await openai.setupDynamicRoutes();
    app.use((req, res, next) => {
      openai.getRouter()(req, res, next);
    });
    res.sendStatus(200);
  });

  await openai.setupDynamicRoutes();
  app.use((req, res, next) => {
    openai.getRouter()(req, res, next);
  });

  app.use("/admin-api", admin);
  app.listen(PORT, "0.0.0.0", () => {});
};

start();
