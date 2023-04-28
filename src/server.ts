require("dotenv").config();
import express from "express";
import payload from "payload";
import openai from "./openai";
import path from "path";

/*
if (!process.env.AIEXPRESS_API_KEY)
  throw new Error(
    "AI Express API key not set. Please set the AIEXPRESS_API_KEY environment variable."
  );
if (!process.env.OPENAI_API_KEY)
  throw new Error(
    "OpenAI API key not set. Please set the OPENAI_API_KEY environment variable."
  );
*/

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.AIEXPRESS_API_KEY;
const mongoURL = process.env.MONGODB_URI || "mongodb://localhost/payload";
const serverURL = process.env.EXTERNAL_HOSTNAME
  ? `https://${process.env.EXTERNAL_HOSTNAME}`
  : "http://localhost:3000";

process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY = apiKey;

app.get("/", (_, res) => {
  res.redirect("/admin");
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
  app.use(openai.router);
  app.post("/api/update-routes", async (req, res) => {
    await openai.setupDynamicRoutes();
    res.sendStatus(200);
  });
  openai.setupDynamicRoutes();
  app.listen(port);
};

start();
