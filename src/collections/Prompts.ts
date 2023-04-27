import { CollectionConfig } from "payload/types";

const count = (str: string) => {
  // Roughly estimate the number of OpenAI tokens in a string
  // https://platform.openai.com/tokenizer
  return parseInt((str.split(" ").length * (4 / 3)).toString());
};

const Prompts: CollectionConfig = {
  slug: "prompts",
  admin: {
    useAsTitle: "name",
    description:
      "Build new API endpoints by adding prompt templates to this collection.",
    disableDuplicate: true,
    defaultColumns: ["name", "description", "prompt"],
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
              ? `POST ${
                  process.env.RENDER_EXTERNAL_HOSTNAME
                    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
                    : "http://localhost:3000"
                }/api/${value.toLowerCase().replaceAll(" ", "-")}`
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
              if (count(value) > 4096) {
                return `Prompt exceeds maximum token length of 4096 tokens (currently ${count(
                  value
                )} tokens).`;
              }
              break;
            case "gpt-4":
              if (count(value) > 8192) {
                return `Prompt exceeds maximum token length of 8192 tokens (currently ${count(
                  value
                )} tokens).`;
              }
              break;
            case "gpt-4-32k":
              if (count(value) > 32768) {
                return `Prompt exceeds maximum token length of 32768 tokens. (currently ${count(
                  value
                )} tokens).`;
              }
              break;
          }
        }
        return true;
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        fetch(
          `${
            process.env.RENDER_EXTERNAL_HOSTNAME
              ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
              : "http://localhost:3000"
          }/api/update-routes`,
          {
            method: "POST",
          }
        );
        return doc;
      },
    ],
  },
};

export default Prompts;
