import { CollectionConfig } from "payload/types";
import { countTokens, getRouteName } from "../util";
import payload from "payload";
import axios from "axios";

const serverURL = process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME
  ? `https://${process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME}`
  : "http://localhost:3000";

const apiKey = process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;

const Prompts: CollectionConfig = {
  slug: "prompts",
  admin: {
    useAsTitle: "name",
    description:
      "Build new API endpoints by adding prompt templates to this collection.",
    disableDuplicate: true,
    defaultColumns: ["name", "description", "model", "createdAt"],
    pagination: {
      defaultLimit: 100,
    },
  },
  fields: [
    {
      name: "model",
      type: "select",
      label: "Language Model",
      required: true,
      options: [
        { label: "GPT 3.5 Turbo", value: "gpt-3.5-turbo" },
        { label: "GPT 4", value: "gpt-4" },
        { label: "GPT 4 32k", value: "gpt-4-32k" },
      ],
      defaultValue: "gpt-3.5-turbo",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "name",
      label: "Endpoint",
      type: "text",
      required: true,
      unique: true,
      admin: {
        placeholder: "Untitled Endpoint",
        description: ({ value }) =>
          `${
            typeof value === "string"
              ? `POST ${serverURL}/api/${getRouteName(value)}`
              : "Required"
          }`,
      },
    },
    {
      name: "description",
      type: "text",
      required: false,
      admin: {
        description:
          "A short description of what this endpoint is for. (Optional)",
      },
    },
    {
      name: "role",
      type: "relationship",
      relationTo: "roles",
      required: false,
      hasMany: false,
      admin: {
        description:
          "Select a system message to use for this endpoint. (Optional)",
        position: "sidebar",
      },
    },
    {
      name: "prompt",
      type: "textarea",
      required: true,
      admin: {
        placeholder: "The customer says {{customerMessage}}. The AI responds:",
        description:
          "All variables must be wrapped in {{doubleBraces}} and will automatically become required by this endpoint's API. You may include descriptions and default values for each variable by using the format {{variableName|defaultValue|description}}. For example, {{customerMessage|Hello|Message sent by the customer}}.",
      },
      validate: (value, { data }) => {
        // Validate each variable wrapped in {{doubleBraces}}
        const regex = /{{([^}]+)}}/g;
        let match;
        while ((match = regex.exec(value)) !== null) {
          const variable = match[1].split("|")[0];
          if (variable.length < 2 || variable.length > 100) {
            return `Please ensure that all variable names are between 2 and 100 characters long. {{${variable}}} is ${variable.length} characters long.`;
          }
          if (/[\s\W]/.test(variable)) {
            return `Please ensure that all variables do not contain spaces, special characters, or dashes. {{${variable}}} contains an invalid character.`;
          }
        }
        if (data.model) {
          switch (data.model) {
            case "gpt-3.5-turbo":
              if (countTokens(value) > 4096) {
                return `Prompt exceeds maximum token length of 4096 tokens (currently ${countTokens(
                  value
                )} tokens).`;
              }
              break;
            case "gpt-4":
              if (countTokens(value) > 8192) {
                return `Prompt exceeds maximum token length of 8192 tokens (currently ${countTokens(
                  value
                )} tokens).`;
              }
              break;
            case "gpt-4-32k":
              if (countTokens(value) > 32768) {
                return `Prompt exceeds maximum token length of 32768 tokens. (currently ${countTokens(
                  value
                )} tokens).`;
              }
              break;
          }
        }
        return true;
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Output Validation",
          name: "validation",
          description:
            "Add validation rules for the AI's response, and automatically retry the request if the AI's response does not pass validation. This ensures a deterministic response from this endpoint, or an error.",
          fields: [
            {
              name: "validationEnabled",
              type: "checkbox",
              label: "Enable Output Validation",
              defaultValue: false,
            },
            {
              name: "maxRetries",
              type: "number",
              label: "Maximum Retries",
              required: false,
              defaultValue: 3,
              min: 1,
              max: 10,
              admin: {
                condition: (_, siblingData) => siblingData.validationEnabled,
              },
            },
            {
              name: "validationFunction",
              type: "code",
              label: "Validation Function",
              required: false,
              defaultValue:
                "function validateOutput() {\n  // Return a specific error message (string) if there is a problem or true if the output passes validation\n  // Result string from AI available as `result`\n  return true;\n}",
              admin: {
                language: "javascript",
                condition: (_, siblingData) => siblingData.validationEnabled,
                description:
                  "If the validation function returns an error message, the AI will be provided with that message and your prompt will be retried, up to the maximum number of retries. If the validation function returns true, the AI's response will be returned.",
              },
            },
          ],
        },
        {
          label: "Rate Limit",
          name: "rateLimit",
          description:
            "Limit the rate at which requests can be made to this endpoint. Useful for preventing abuse of endpoints with particularly large or expensive prompts. Edits to this prompt will reset the rate limit meter. Rate limiting uses a memory store and will not work on longer timescales on ephemeral free-tier instances.",
          fields: [
            {
              name: "rateLimitEnabled",
              type: "checkbox",
              label: "Enable Rate Limit",
              defaultValue: false,
            },
            {
              name: "requestsPerUnit",
              type: "number",
              label: "Requests per Time Unit",
              required: false,
              defaultValue: 60,
              admin: {
                condition: (_, siblingData) => siblingData.rateLimitEnabled,
              },
            },
            {
              name: "timeUnit",
              type: "select",
              label: "Time Unit",
              required: false,
              options: [
                { label: "Minute", value: "minute" },
                { label: "Hour", value: "hour" },
                { label: "Day", value: "day" },
              ],
              defaultValue: "minute",
              admin: {
                condition: (_, siblingData) => siblingData.rateLimitEnabled,
              },
            },
          ],
        },
        {
          label: "Redact PII",
          name: "redaction",
          description:
            "Automatically redact or fail if personal identifiable information is detected in the API request, before the request is sent to the AI.",
          fields: [
            {
              name: "redactionEnabled",
              type: "checkbox",
              label: "Enable PII Redaction",
              defaultValue: false,
            },
            {
              name: "redactionMode",
              type: "select",
              label: "Redaction Mode",
              required: false,
              options: [
                { label: "Redact", value: "redact" },
                { label: "Fail", value: "fail" },
              ],
              defaultValue: "redact",
              admin: {
                condition: (_, siblingData) => siblingData.redactionEnabled,
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        payload.logger.info("Updating routes...");
        axios.post(
          `${serverURL}/api/update-routes`,
          {},
          {
            headers: {
              "x-api-key": apiKey,
            },
          }
        );
        return doc;
      },
    ],
  },
};

export default Prompts;
