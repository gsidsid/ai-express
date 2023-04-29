require("dotenv").config();
import express from "express";
import payload from "payload";
import openai from "./openai";
import path from "path";

if (!process.env.AIEXPRESS_API_KEY)
  throw new Error(
    "AI Express API key not set. Please set the AIEXPRESS_API_KEY environment variable."
  );
if (!process.env.OPENAI_API_KEY)
  throw new Error(
    "OpenAI API key not set. Please set the OPENAI_API_KEY environment variable."
  );

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const apiKey = process.env.AIEXPRESS_API_KEY;
const mongoURL =
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  "mongodb://0.0.0.0/payload";
const serverURL = process.env.EXTERNAL_HOSTNAME
  ? `https://${process.env.EXTERNAL_HOSTNAME}`
  : `http://0.0.0.0:${process.env.PORT || 3000}`;

process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY = apiKey;

app.get("/", (_, res) => {
  res.redirect("/admin");
});

app.get("/health", (_, res) => {
  res.sendStatus(200);
});

const start = async () => {
  app.use("/assets", express.static(path.resolve(__dirname, "./assets")));
  await payload.init({
    secret: apiKey,
    mongoURL,
    express: app,
    onInit: async () => {
      payload.logger.info(
        `AI Express server successfully started. Get started by adding a new prompt at ${serverURL}.`
      );
    },
  });
  app.use(express.json());
  app.post("/update-routes", async (req, res) => {
    await openai.setupDynamicRoutes();
    app.use(function (req, res, next) {
      openai.getRouter()(req, res, next);
    });
    res.sendStatus(200);
  });
  await openai.setupDynamicRoutes();
  app.use(function (req, res, next) {
    openai.getRouter()(req, res, next);
  });
  app.listen(port, "0.0.0.0", () => {});
};

start();
