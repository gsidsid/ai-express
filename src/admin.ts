import express from "express";
import payload from "payload";
import {
  apiKeyMiddleware,
  inferVariablesFromPrompt,
  getRouteName,
} from "./util";

const serverURL = process.env.EXTERNAL_HOSTNAME
  ? `https://${process.env.EXTERNAL_HOSTNAME}`
  : `http://0.0.0.0:${process.env.PORT || 3000}`;
var router = express.Router();
router.use(apiKeyMiddleware);

router.get("/prompts", async (req, res) => {
  try {
    let { docs } = await payload.find({
      collection: "prompts",
    });
    let endpoints = docs.map((doc) => {
      return {
        name: doc.name,
        description: doc.description,
        endpoint: `${serverURL}/api/${getRouteName(doc.name)}`,
        variables: inferVariablesFromPrompt(doc.prompt),
      };
    });
    res.json(endpoints);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* PLUGIN WIP

router.post("/prompts", async (req, res) => {
  try {
    let { name, description, prompt, model } = req.body;
    if (!name || typeof name !== "string") {
      throw new Error("Name is required");
    }
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt is required");
    }

    let { docs } = await payload.find({
      collection: "prompts",
      limit: 1,
      where: {
        name: {
          equals: name,
        },
      },
    });
    if (docs.length > 0) {
      throw new Error("Name already exists");
    }

    let variables = inferVariablesFromPrompt(prompt);
    await payload.create({
      collection: "prompts",
      data: {
        name,
        description: description || "",
        prompt,
        model: model || "gpt-3.5-turbo",
      },
    });
    res.json({
      name,
      description: description || "",
      endpoint: `${serverURL}/api/${getRouteName(name)}`,
      variables,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
*/

export default router;
