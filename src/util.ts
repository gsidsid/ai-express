import { Prompt, Role } from "./payload-types";

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

    const endpointName = `${
      process.env.PAYLOAD_PUBLIC_SERVER_URL
    }/api/${prompt.name.toLowerCase().replaceAll(" ", "-")}`;
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
    schemes: [process.env.PAYLOAD_PUBLIC_SERVER_URL?.split(":")[0] || "http"],
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

export {
  inferVariablesFromPrompt,
  stringify,
  isRole,
  apiKeyMiddleware,
  generateSwaggerSpec,
};
