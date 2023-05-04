"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var payload_1 = __importDefault(require("payload"));
var util_1 = require("./util");
var serverURL = process.env.EXTERNAL_HOSTNAME
    ? "https://".concat(process.env.EXTERNAL_HOSTNAME)
    : "http://0.0.0.0:".concat(process.env.PORT || 3000);
var router = express_1.default.Router();
router.use(util_1.apiKeyMiddleware);
router.get("/prompts", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var docs, endpoints, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, payload_1.default.find({
                        collection: "prompts",
                    })];
            case 1:
                docs = (_a.sent()).docs;
                endpoints = docs.map(function (doc) {
                    return {
                        name: doc.name,
                        description: doc.description,
                        endpoint: "".concat(serverURL, "/api/").concat((0, util_1.getRouteName)(doc.name)),
                        variables: (0, util_1.inferVariablesFromPrompt)(doc.prompt),
                    };
                });
                res.json(endpoints);
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                res.status(500).json({ error: e_1.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/* PLUGIN WIP

router.post("/prompts", async (req, res) => {
  try {
    let { name, description, prompt, model } = req.body;
    if (!name || typeof name !== "string") {
      throw new Error("Name is required");
    }
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt is required");
    }

    let { docs } = await payload.find({
      collection: "prompts",
      limit: 1,
      where: {
        name: {
          equals: name,
        },
      },
    });
    if (docs.length > 0) {
      throw new Error("Name already exists");
    }

    let variables = inferVariablesFromPrompt(prompt);
    await payload.create({
      collection: "prompts",
      data: {
        name,
        description: description || "",
        prompt,
        model: model || "gpt-3.5-turbo",
      },
    });
    res.json({
      name,
      description: description || "",
      endpoint: `${serverURL}/api/${getRouteName(name)}`,
      variables,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
*/
exports.default = router;
