import express from "express";
import payload from "payload";
import dynamicMiddleware from "express-dynamic-middleware";
import { Configuration, OpenAIApi } from "openai";
import {
  apiKeyMiddleware,
  inferVariablesFromPrompt,
  stringify,
  isRole,
  getRouteName,
  createRateLimiter,
  redactPII,
  validateOutput,
  replaceVariable,
} from "./util";

const router = express.Router();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
var rateLimitMiddlewareHandles = {};

async function setupDynamicRoutes() {
  try {
    const routes = await payload.find({ collection: "prompts" });
    routes.docs.forEach((route) => {
      // Apply rate limiting middleware
      if (rateLimitMiddlewareHandles[getRouteName(route.name)]) {
        let { func, dynamicRL } =
          rateLimitMiddlewareHandles[getRouteName(route.name)];
        dynamicRL?.unuse(func);
        delete rateLimitMiddlewareHandles[getRouteName(route.name)];
      }
      if (route.rateLimit.rateLimitEnabled) {
        rateLimitMiddlewareHandles[getRouteName(route.name)] = {
          func: createRateLimiter(route),
        };
        let dynamicRL = dynamicMiddleware.create(
          rateLimitMiddlewareHandles[getRouteName(route.name)].func
        );
        rateLimitMiddlewareHandles[getRouteName(route.name)].handle = dynamicRL;
        router.use(`/api/${getRouteName(route.name)}`, dynamicRL.handle());
      }
      router.post(`/api/${getRouteName(route.name)}`, async (req, res) => {
        try {
          let { model, prompt } = route;
          let systemMessage =
            route.role && isRole(route.role) ? route.role.value : null;
          let variables = inferVariablesFromPrompt(prompt);

          for (const variable of variables) {
            let variableValue = stringify(req.body[variable.name]);

            // Redact PII from the input variables if enabled
            if (route.redaction.redactionEnabled && variableValue) {
              const redactedVariableValue = await redactPII(variableValue);
              if (
                route.redaction.redactionMode === "fail" &&
                redactedVariableValue !== variableValue
              ) {
                return res.status(400).json({
                  result: null,
                  error: `Input contains PII in ${variable.name}`,
                });
              }
              variableValue = redactedVariableValue;
            } else {
              variableValue = variableValue || variable.defaultValue;
            }

            if (
              !req.body[variable.name] &&
              variable.defaultValue === undefined
            ) {
              return res.status(400).json({
                result: null,
                error: `Missing required parameter ${variable.name} in POST body`,
              });
            } else {
              prompt = replaceVariable(prompt, variable.name, variableValue);
            }
          }

          let retryCount = 0;
          let validationResult = { valid: false, errorMessage: null };
          let result = null;
          let messages = [];
          if (systemMessage) {
            messages.push({
              role: "system",
              content: systemMessage,
            });
          }
          messages.push({
            role: "user",
            content: prompt,
          });
          payload.logger.info(`Submitting prompt: ${prompt}`);
          do {
            let completion = await openai.createChatCompletion({
              model,
              messages,
            });
            result = completion.data.choices[0].message?.content.trim();

            // Validate output if enabled
            if (route.validation.validationEnabled) {
              validationResult = await validateOutput(
                route.validation.validationFunction,
                result
              );
              if (validationResult.valid) break;
              // Retry with error message as user input
              let correctionPrompt = [
                {
                  role: "assistant",
                  content: result,
                },
                {
                  role: "user",
                  content: validationResult.errorMessage,
                },
              ];
              if (messages.length <= 2) {
                messages = messages.concat(correctionPrompt);
              } else {
                // Replace the last two messages instead of appending each retry to minimize context usage
                messages[messages.length - 2] = correctionPrompt[0];
                messages[messages.length - 1] = correctionPrompt[1];
              }
            } else {
              validationResult.valid = true;
              break;
            }
            retryCount++;
          } while (retryCount <= route.validation.maxRetries);

          if (!validationResult.valid) {
            return res.status(400).json({
              result: null,
              error: `Validation failed after ${retryCount} retries: ${validationResult.errorMessage}`,
            });
          }

          res.status(200).json({ result, error: null });
        } catch (error) {
          payload.logger.error(`Error in route /api/${route.name}: ${error}`);
          res.status(500).json({ result: null, error: error.message });
        }
      });
    });
  } catch (error) {
    payload.logger.error(
      "Error while setting up dynamic routes: " + error.message
    );
  }
}

router.use(apiKeyMiddleware);

export default { router, setupDynamicRoutes };
