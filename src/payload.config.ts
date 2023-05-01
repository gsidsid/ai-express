import { buildConfig } from "payload/config";
import payloadSimpleRBAC from "@nouance/payload-simple-rbac";
import path from "path";
import Prompts from "./collections/Prompts";
import Roles from "./collections/Roles";
import Users from "./collections/Users";
import ApiDocs from "./components/ApiDocs.js";
import { Logo, Icon } from "./components/Graphics";
import dotenv from "dotenv";
// import formBuilder from "@payloadcms/plugin-form-builder";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const serverURL = process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME
  ? `https://${process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME}`
  : `http://0.0.0.0:${process.env.PAYLOAD_PUBLIC_PORT || 3000}`;

export const roles = ["viewer", "editor", "admin"];

export default buildConfig({
  serverURL,
  collections: [Prompts, Roles, Users],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  telemetry: false,
  routes: {
    api: "/api",
    admin: "/admin",
  },
  plugins: [
    payloadSimpleRBAC({
      roles,
      users: [Users.slug],
      defaultRole: "admin",
      collections: [
        {
          slug: Prompts.slug,
          permissions: {
            read: "public",
            update: "editor",
            create: "editor",
            delete: "editor",
          },
        },
        {
          slug: Roles.slug,
          permissions: {
            read: "public",
            update: "editor",
            create: "editor",
            delete: "editor",
          },
        },
        {
          slug: Users.slug,
          permissions: {
            read: "admin",
            update: "admin",
            create: "admin",
            delete: "admin",
          },
        },
      ],
    }),
  ],
  admin: {
    avatar: "gravatar",
    components: {
      graphics: {
        Logo,
        Icon,
      },
      afterDashboard: [ApiDocs],
    },
    css: path.resolve(__dirname, "./styles/app.css"),
    meta: {
      titleSuffix: "– AI Express",
      favicon: "/assets/favicon.svg",
    },
    webpack: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: require.resolve("browserify-fs"),
        child_process: false,
        stream: require.resolve("stream-browserify"),
        vm: require.resolve("vm-browserify"),
        request: require.resolve("browser-request"),
      };
      return config;
    },
  },
});
