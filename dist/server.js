"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
var express_1 = __importDefault(require("express"));
var payload_1 = __importDefault(require("payload"));
var openai_1 = __importDefault(require("./openai"));
var path_1 = __importDefault(require("path"));
if (!process.env.AIEXPRESS_API_KEY)
  throw new Error(
    "AI Express API key not set. Please set the AIEXPRESS_API_KEY environment variable."
  );
if (!process.env.OPENAI_API_KEY)
  throw new Error(
    "OpenAI API key not set. Please set the OPENAI_API_KEY environment variable."
  );
var app = (0, express_1.default)();
var port = process.env.PORT || 3000;
var apiKey = process.env.AIEXPRESS_API_KEY;
var mongoURL = process.env.MONGODB_URI || "mongodb://localhost/payload";
var serverURL = process.env.RENDER_EXTERNAL_HOSTNAME
  ? "https://".concat(process.env.RENDER_EXTERNAL_HOSTNAME)
  : "http://localhost:3000";
process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY = apiKey;
app.get("/", function (_, res) {
  res.redirect("/admin");
});
var start = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          app.use(
            "/assets",
            express_1.default.static(
              path_1.default.resolve(__dirname, "./assets")
            )
          );
          return [
            4 /*yield*/,
            payload_1.default.init({
              secret: apiKey,
              mongoURL: mongoURL,
              express: app,
              onInit: function () {
                return __awaiter(void 0, void 0, void 0, function () {
                  return __generator(this, function (_a) {
                    payload_1.default.logger.info(
                      "AI Express server successfully started. Get started by adding a new prompt at ".concat(
                        serverURL,
                        "."
                      )
                    );
                    return [2 /*return*/];
                  });
                });
              },
            }),
          ];
        case 1:
          _a.sent();
          app.use(express_1.default.json());
          app.use(openai_1.default.router);
          app.post("/api/update-routes", function (req, res) {
            return __awaiter(void 0, void 0, void 0, function () {
              return __generator(this, function (_a) {
                switch (_a.label) {
                  case 0:
                    return [4 /*yield*/, openai_1.default.setupDynamicRoutes()];
                  case 1:
                    _a.sent();
                    res.sendStatus(200);
                    return [2 /*return*/];
                }
              });
            });
          });
          openai_1.default.setupDynamicRoutes();
          app.listen(port);
          return [2 /*return*/];
      }
    });
  });
};
start();
