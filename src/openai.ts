import express from "express";
import payload from "payload";
import { Configuration, OpenAIApi } from "openai";
import {
  apiKeyMiddleware,
  inferVariablesFromPrompt,
  stringify,
  isRole,
} from "./util";

const router = express.Router();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function setupDynamicRoutes() {
  try {
    const routes = await payload.find({ collection: "prompts" });
    routes.docs.forEach((route) => {
      router.post(
        `/api/${route.name.toLowerCase().replaceAll(" ", "-")}`,
        async (req, res) => {
          try {
            let { model, prompt } = route;
            let systemMessage =
              route.role && isRole(route.role) ? route.role.value : null;
            let variables = inferVariablesFromPrompt(prompt);
            for (const variable of variables) {
              if (
                !req.body[variable.name] &&
                variable.defaultValue === undefined
              ) {
                return res.status(400).json({
                  result: null,
                  error: `Missing required parameter in ${variable.name} in POST body`,
                });
              } else {
                prompt = prompt.replaceAll(
                  `{{${variable.name}}}`,
                  stringify(req.body[variable.name]) || variable.defaultValue
                );
              }
            }
            let messages = [];
            if (systemMessage) {
              messages.push({
                role: "system",
                content: systemMessage,
              });
            }
            messages.push({
              role: "assistant",
              content: prompt,
            });
            let completion = await openai.createChatCompletion({
              model,
              messages,
            });
            let result = null;
            if (completion.data.choices[0].message?.content) {
              result = completion.data.choices[0].message.content.trim();
            }
            res.status(200).json({ result, error: null });
          } catch (error) {
            payload.logger.error(`Error in route /api/${route.name}: ${error}`);
            res.status(500).json({ result: null, error: error });
          }
        }
      );
    });
  } catch (error) {
    payload.logger.error("Error while setting up dynamic routes:", error);
  }
}

router.use(apiKeyMiddleware);

export default { router, setupDynamicRoutes };
