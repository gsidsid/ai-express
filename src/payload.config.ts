import { buildConfig } from "payload/config";
import path from "path";
import Prompts from "./collections/Prompts";
import Roles from "./collections/Roles";
import ApiDocs from "./components/ApiDocs.js";
import { Logo, Icon } from "./components/Graphics";
import dotenv from "dotenv";
// import formBuilder from "@payloadcms/plugin-form-builder";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const serverURL = process.env.PAYLOAD_PUBLIC_RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.PAYLOAD_PUBLIC_RENDER_EXTERNAL_HOSTNAME}`
  : "http://localhost:3000";

export default buildConfig({
  serverURL,
  collections: [Prompts, Roles],
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
  admin: {
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
  plugins: [],
});
