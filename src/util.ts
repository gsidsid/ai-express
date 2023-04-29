import { Prompt, Role } from "./payload-types";
import rateLimit from "express-rate-limit";
import payload from "payload";
import { AsyncRedactor } from "redact-pii";
import safeEval from "safe-eval";

interface SwaggerSpec {
  swagger: string;
  info: {
    version: string;
    title: string;
    description: string;
  };
  basePath: string;
  schemes: string[];
  securityDefinitions: {
    apiKeyHeader: {
      type: string;
      in: string;
      name: string;
      description: string;
    };
  };
  paths: Record<string, any>;
  definitions: Record<string, any>;
  security: { apiKeyHeader: any[] }[];
}

const serverURL = process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME
  ? `https://${process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME}`
  : `http://0.0.0.0:${process.env.PAYLOAD_PUBLIC_PORT || 3000}`;
const mongoURL =
  process.env.PAYLOAD_PUBLIC_MONGODB_URI || "mongodb://0.0.0.0/payload";

function getMongoDBDetails() {
  let connectionString = mongoURL;
  const regex = /^mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@(.+)$/;
  const match = connectionString.match(regex);
  if (match) {
    const user = match[1];
    const password = match[2];
    const uri = `mongodb+srv://${match[3]}`;
    return { user, password, uri };
  } else {
    throw new Error("Invalid MongoDB connection string");
  }
}

/**
 * Infers variables from a text prompt in the format {{variableName}}, with optional description and default value.
 * The description and default value can be added in the format {{variableName|defaultValue|description}}.
 *
 * @param prompt - The text prompt containing variables to be inferred.
 * @returns An array of inferred variables with their properties.
 */
const inferVariablesFromPrompt = (
  prompt: string
): Array<{ name: string; description?: string; defaultValue?: string }> => {
  const regex = /{{([^}]+)}}/g;
  let match: RegExpExecArray | null;
  let variables: Array<{
    name: string;
    description?: string;
    defaultValue?: string;
  }> = [];

  while ((match = regex.exec(prompt)) !== null) {
    const variable = match[1];
    const variableInfo = variable.split("|");
    let variableDefinition: {
      name: string;
      description?: string;
      defaultValue?: string;
    } = {
      name: variableInfo[0],
    } as { name: string; description?: string; defaultValue?: string };

    if (variableInfo.length > 1) {
      variableDefinition["defaultValue"] = variableInfo[1];
    }

    if (variableInfo.length > 2) {
      variableDefinition["description"] = variableInfo[2];
    }

    variables.push(variableDefinition);
  }
  return variables;
};

/**
 * Converts an object to a string representation within a prompt.
 *
 * @param obj - The object to stringify.
 * @returns The string representation of the object.
 */
const stringify = (obj: unknown): string => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string") return obj;
  return JSON.stringify(obj, null, 2);
};

/**
 * Type guard for checking if an object is of type Role.
 *
 * @param role - The object to be checked.
 * @returns True if the object is of type Role, false otherwise.
 */
const isRole = (role: string | Role): role is Role => {
  return (role as Role).value !== undefined;
};

/**
 * Middleware to verify API key in request header.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
const apiKeyMiddleware = (req, res, next): void => {
  const apiKey = req.headers["x-api-key"];
  if (
    process.env.AIEXPRESS_API_KEY &&
    (!apiKey || apiKey !== process.env.AIEXPRESS_API_KEY)
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

/**
 * Generates a Swagger spec JSON object based on the provided prompts.
 * Each prompt is transformed into a POST endpoint, with variables in the prompt being
 * included as POST body parameters. If a variable has a default value, the parameter
 * is treated as optional; otherwise, it is required. The endpoints also include the
 * x-api-key header for authentication.
 *
 * @param prompts - The array of prompts to be used for generating the Swagger spec.
 * @returns The Swagger spec JSON object.
 */
const generateSwaggerSpec = (prompts: Prompt[]): SwaggerSpec => {
  const paths: Record<string, any> = {};
  const definitions: Record<string, any> = {};

  prompts.forEach((prompt) => {
    const variables = inferVariablesFromPrompt(prompt.prompt);
    const properties = variables.reduce((acc, variable) => {
      acc[variable.name] = {
        type: "string",
        default: variable.defaultValue ?? "",
        description: variable.description ?? "",
      };
      return acc;
    }, {});

    const endpointName = `/api/${getRouteName(prompt.name)}`;
    const schemaName = `${prompt.name} Request Body`;

    paths[endpointName] = {
      post: {
        tags: [prompt.name],
        description: prompt.description,
        consumes: ["application/json"],
        produces: ["application/json"],
        parameters: [
          {
            name: "body",
            in: "body",
            required: true,
            schema: {
              $ref: `#/definitions/${schemaName}`,
            },
          },
        ],
        responses: {
          200: {
            description: "Success",
            schema: {
              type: "object",
              properties: {
                result: {
                  type: "string",
                },
              },
            },
          },
          400: {
            description: "Bad Request - Missing expected variable",
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
            },
          },
          500: {
            description: "Internal Server Error",
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
            },
          },
        },
        security: [{ apiKeyHeader: [] }],
      },
    };

    definitions[schemaName] = {
      type: "object",
      properties,
    };
  });

  return {
    swagger: "2.0",
    info: {
      version: "1.0.0",
      title: "Language Model API",
      description: "An API for generating text from various prompts.",
    },
    basePath: "",
    schemes: [serverURL.split(":")[0] || "http"],
    securityDefinitions: {
      apiKeyHeader: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key for authentication",
      },
    },
    paths,
    definitions,
    security: [{ apiKeyHeader: [] }],
  };
};

const countTokens = (str: string) => {
  // https://platform.openai.com/tokenizer
  return parseInt((str.split(" ").length * (4 / 3)).toString());
};

const getRouteName = (name: string) => {
  return name?.toLowerCase().replaceAll(" ", "-");
};

// Helper function for rate limiting
const createRateLimiter = (route) => {
  // timeUnit is "minute", "hour", "day", or "month"
  let timeUnitMs;
  switch (route.rateLimit.timeUnit) {
    case "minute":
      timeUnitMs = 60 * 1000;
      break;
    case "hour":
      timeUnitMs = 60 * 60 * 1000;
      break;
    case "day":
      timeUnitMs = 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error("Invalid time unit");
  }
  return rateLimit({
    windowMs: timeUnitMs,
    max: route.rateLimit.requestsPerUnit,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Helper function for PII redaction
const redactPII = async (text) => {
  const redactor = new AsyncRedactor();
  return await redactor.redactAsync(text);
};

// Helper function for output validation
const validateOutput = (validationFunction, result) => {
  const validationResult = safeEval(`${validationFunction}()`, { result });
  if (validationResult === true) {
    return { valid: true, errorMessage: null };
  } else if (typeof validationResult === "string") {
    payload.logger.info(`Result: ${result}`);
    payload.logger.info(`Error: ${JSON.stringify(validationResult)}`);
    return { valid: false, errorMessage: validationResult };
  } else if (validationResult === false) {
    payload.logger.info(`Result: ${result}`);
    payload.logger.info(`Error: "Invalid output. Please try again."`);
    return { valid: false, errorMessage: "Invalid output. Please try again." };
  } else {
    throw new Error("Invalid output validation function");
  }
};

const replaceVariable = (template, variable, value) => {
  const regex = new RegExp(`{{${variable}(?:\\|[^}|]+)?(?:\\|[^}]*)?}}`, "g");
  return template.replace(regex, () => value);
};

export {
  inferVariablesFromPrompt,
  stringify,
  isRole,
  apiKeyMiddleware,
  generateSwaggerSpec,
  getRouteName,
  countTokens,
  createRateLimiter,
  redactPII,
  validateOutput,
  replaceVariable,
};
