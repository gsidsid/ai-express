"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("payload/config");
var path_1 = __importDefault(require("path"));
var Prompts_1 = __importDefault(require("./collections/Prompts"));
var Roles_1 = __importDefault(require("./collections/Roles"));
var ApiDocs_js_1 = __importDefault(require("./components/ApiDocs.js"));
var Graphics_1 = require("./components/Graphics");
var dotenv_1 = __importDefault(require("dotenv"));
// import formBuilder from "@payloadcms/plugin-form-builder";
dotenv_1.default.config({
  path: path_1.default.resolve(__dirname, "../.env"),
});
var serverURL = process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME
  ? "https://".concat(process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME)
  : "http://localhost:3000";
exports.default = (0, config_1.buildConfig)({
  serverURL: serverURL,
  collections: [Prompts_1.default, Roles_1.default],
  typescript: {
    outputFile: path_1.default.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path_1.default.resolve(
      __dirname,
      "generated-schema.graphql"
    ),
  },
  telemetry: false,
  routes: {
    api: "/api",
    admin: "/admin",
  },
  admin: {
    components: {
      graphics: {
        Logo: Graphics_1.Logo,
        Icon: Graphics_1.Icon,
      },
      afterDashboard: [ApiDocs_js_1.default],
    },
    css: path_1.default.resolve(__dirname, "./styles/app.css"),
    meta: {
      titleSuffix: "– AI Express",
      favicon: "/assets/favicon.svg",
    },
    webpack: function (config) {
      config.resolve.fallback = __assign(
        __assign({}, config.resolve.fallback),
        {
          fs: require.resolve("browserify-fs"),
          child_process: false,
          stream: require.resolve("stream-browserify"),
          vm: require.resolve("vm-browserify"),
          request: require.resolve("browser-request"),
        }
      );
      return config;
    },
  },
  plugins: [],
});
