import express from "express";
import payload from "payload";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Prompt } from "./payload-types";
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
import { addToCache, getFromCache } from "./cache";

// Initialize OpenAI API client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Initialize the router
let router: express.Router | null = null;

async function setupDynamicRoutes() {
  try {
    // Create a new router and apply the API key middleware
    router = express.Router();
    router.use(apiKeyMiddleware);

    // Retrieve prompts from the database
    const { docs } = await payload.find({ collection: "prompts" });

    // Iterate over each prompt and create a dynamic route
    docs?.forEach((route: Prompt) => {
      // Validate the route name
      if (!route.name || typeof route.name !== "string") {
        return;
      }

      // Apply rate limiting middleware if enabled
      if (route.rateLimit.rateLimitEnabled) {
        router.use(
          `/api/${getRouteName(route.name)}`,
          createRateLimiter(route)
        );
      }

      // Define the route handler
      router.post(
        `/api/${getRouteName(route.name)}`,
        async (req, res, next) => {
          try {
            // Generate a cache key based on the route name and request body
            const cacheKey = `${route.name}-${JSON.stringify(req.body)}`;

            // Check if caching is enabled and if the result is in the cache
            if (route.caching.cachingEnabled) {
              const cachedResult = getFromCache(cacheKey, route.caching.cacheTTL);
              if (cachedResult) {
                    return res
                  .status(200)
                  .json({ result: cachedResult.result, error: null });
              }
            }

            // Extract model and prompt from the route
            let { model, prompt, params } = route;

            // Determine the system message based on the role
            const systemMessage =
              route.role && isRole(route.role) ? route.role.value : null;

            // Infer variables from the prompt and process them
            const variables = inferVariablesFromPrompt(prompt);
            let processedPrompt = prompt;
            for (const variable of variables) {
              let variableValue = stringify(req.body[variable.name]);

              // Redact PII from the input variables if enabled
              if (route.redaction.redactionEnabled && variableValue) {
                const redactedVariableValue = await redactPII(route.redaction.redactionOptions, variableValue);
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
                variableValue = variableValue ?? variable.defaultValue;
              }
              // Validate the presence of required parameters
              if (variableValue === undefined) {
                return res.status(400).json({
                  result: null,
                  error: `Missing required parameter ${variable.name} in POST body`,
                });
              }

              // Replace variables in the prompt with their values
              processedPrompt = replaceVariable(
                processedPrompt,
                variable.name,
                variableValue
              );
            }

            // Initialize variables for validation and retries
            let retryCount = 0;
            let validationResult = { valid: false, errorMessage: null };
            let result: string | null = null;
            let messages: ChatCompletionRequestMessage[] = [];

            // Add system message to the conversation if present
            if (systemMessage) {
              messages.push({ role: "system", content: systemMessage });
            }

            // Add user message to the conversation
            messages.push({ role: "user", content: processedPrompt });

            // Log the submitted prompt
            payload.logger.info(`Submitting prompt: ${processedPrompt}`);

            // Loop to handle retries and validation
            do {
              // Request a completion from the OpenAI API
              const completion = await openai.createChatCompletion({
                model,
                messages,
                temperature: params?.temperature,
                top_p: params?.top_p,
                presence_penalty: params?.presence_penalty,
                frequency_penalty: params?.frequency_penalty,
                logit_bias: params?.logit_bias && typeof params.logit_bias === "object" && Object.keys(params.logit_bias).length > 0 ? params.logit_bias : undefined,
              });
              result = completion.data.choices[0].message?.content.trim();

              // Validate the output if validation is enabled
              if (route.validation.validationEnabled) {
                validationResult = await validateOutput(
                  route.validation.validationFunction,
                  result
                );
                if (validationResult.valid) break;

                // Retry with error message as user input
                const correctionPrompt: ChatCompletionRequestMessage[] = [
                  { role: "assistant", content: result },
                  { role: "user", content: validationResult.errorMessage },
                ];
                if (messages.length <= 2) {
                  messages = messages.concat(correctionPrompt);
                } else {
                  // Replace the last two messages to minimize context usage
                  messages[messages.length - 2] = correctionPrompt[0];
                  messages[messages.length - 1] = correctionPrompt[1];
                }
              } else {
                validationResult.valid = true;
                break;
              }

              // Raise the temperature slightly on each retry
              if (params?.temperature && typeof params.temperature === "number") {
                params.temperature = Math.min(params.temperature + 0.05, 1);
              }

              retryCount++;
            } while (retryCount <= route.validation.maxRetries);

            // Handle validation failure
            if (!validationResult.valid) {
              return res.status(400).json({
                result: null,
                error: `Validation failed after ${retryCount} tries: ${validationResult.errorMessage}`,
              });
            }

            // Store the result in the cache if caching is enabled
            if (route.caching.cachingEnabled) {
              addToCache(cacheKey, { result: result, timestamp: Date.now() });
            }

            res.status(200).json({ result, error: null });
          } catch (error) {
            payload.logger.error(`Error in route /api/${route.name}: ${error}`);
            res.status(500).json({ result: null, error: error.message });
          }
        }
      );
    });
  } catch (error) {
    payload.logger.error(
      "Error while setting up dynamic routes: " + error.message
    );
  }
}

function getRouter() {
  return router;
}

export default { setupDynamicRoutes, getRouter };

