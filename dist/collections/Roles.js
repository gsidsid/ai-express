"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Roles = {
    slug: "roles",
    admin: {
        useAsTitle: "name",
        description: "Configure system messages to use across all your prompts here. System messages are useful for steering the output of your prompts to match specific formats.",
        disableDuplicate: true,
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
            unique: true,
            admin: {
                placeholder: "Support Agent",
                description: "A friendly name to help you identify this role.",
            },
        },
        {
            label: "System Message",
            name: "value",
            type: "textarea",
            required: true,
            admin: {
                placeholder: "You are a helpful AI assistant. Answer the customer's questions concisely and help them solve their problems.",
                description: "This is the system message that will be used for this role. Variables like {{this}} are not supported here.",
            },
        },
    ],
};
exports.default = Roles;
