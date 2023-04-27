import { buildConfig } from "payload/config";
import path from "path";
import Prompts from "./collections/Prompts";
import Roles from "./collections/Roles";
import Users from "./collections/Users";
import ApiDocs from "./components/ApiDocs.js";
import { Logo, Icon } from "./components/Graphics";
// import formBuilder from "@payloadcms/plugin-form-builder";

const serverURL = process.env.RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
  : "http://localhost:3000";

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
  admin: {
    user: Users.slug,
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
  },
  plugins: [],
});
