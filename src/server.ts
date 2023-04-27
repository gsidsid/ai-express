require("dotenv").config();
import express from "express";
import payload from "payload";
import openai from "./openai";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;
const mongodbUrl =
  process.env.RENDER_DATABASE_URL || "mongodb://localhost/payload";

app.get("/", (_, res) => {
  res.redirect("/admin");
});

const start = async () => {
  process.env.PAYLOAD_PUBLIC_SERVER_URL = process.env.RENDER_EXTERNAL_HOSTNAME
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
    : "http://localhost:3000";
  process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY = process.env.AIEXPRESS_API_KEY;
  app.use("/assets", express.static(path.resolve(__dirname, "./assets")));
  await payload.init({
    secret: process.env.AIEXPRESS_API_KEY,
    mongoURL: mongodbUrl,
    express: app,
    onInit: async () => {
      payload.logger.info(
        `AI Express server successfully started. Get started by adding a new prompt at ${payload.getAdminURL()}.`
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
