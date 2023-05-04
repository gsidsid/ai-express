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
var openai_1 = require("openai");
var util_1 = require("./util");
var cache_1 = require("./cache");
// Initialize OpenAI API client
var configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
var openai = new openai_1.OpenAIApi(configuration);
// Initialize the router
var router = null;
function setupDynamicRoutes() {
    return __awaiter(this, void 0, void 0, function () {
        var docs, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Create a new router and apply the API key middleware
                    router = express_1.default.Router();
                    router.use(util_1.apiKeyMiddleware);
                    return [4 /*yield*/, payload_1.default.find({ collection: "prompts" })];
                case 1:
                    docs = (_a.sent()).docs;
                    // Iterate over each prompt and create a dynamic route
                    docs === null || docs === void 0 ? void 0 : docs.forEach(function (route) {
                        // Validate the route name
                        if (!route.name || typeof route.name !== "string") {
                            return;
                        }
                        // Apply rate limiting middleware if enabled
                        if (route.rateLimit.rateLimitEnabled) {
                            router.use("/api/".concat((0, util_1.getRouteName)(route.name)), (0, util_1.createRateLimiter)(route));
                        }
                        // Define the route handler
                        router.post("/api/".concat((0, util_1.getRouteName)(route.name)), function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                            var cacheKey, cachedResult, model, prompt_1, params, systemMessage, variables, processedPrompt, _i, variables_1, variable, variableValue, redactedVariableValue, retryCount, validationResult, result, messages, completion, correctionPrompt, error_2;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 14, , 15]);
                                        cacheKey = "".concat(route.name, "-").concat(JSON.stringify(req.body));
                                        // Check if caching is enabled and if the result is in the cache
                                        if (route.caching.cachingEnabled) {
                                            cachedResult = (0, cache_1.getFromCache)(cacheKey, route.caching.cacheTTL);
                                            if (cachedResult) {
                                                return [2 /*return*/, res
                                                        .status(200)
                                                        .json({ result: cachedResult.result, error: null })];
                                            }
                                        }
                                        model = route.model, prompt_1 = route.prompt, params = route.params;
                                        systemMessage = route.role && (0, util_1.isRole)(route.role) ? route.role.value : null;
                                        variables = (0, util_1.inferVariablesFromPrompt)(prompt_1);
                                        processedPrompt = prompt_1;
                                        _i = 0, variables_1 = variables;
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < variables_1.length)) return [3 /*break*/, 6];
                                        variable = variables_1[_i];
                                        variableValue = (0, util_1.stringify)(req.body[variable.name]);
                                        if (!(route.redaction.redactionEnabled && variableValue)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, (0, util_1.redactPII)(route.redaction.redactionOptions, variableValue)];
                                    case 2:
                                        redactedVariableValue = _b.sent();
                                        if (route.redaction.redactionMode === "fail" &&
                                            redactedVariableValue !== variableValue) {
                                            return [2 /*return*/, res.status(400).json({
                                                    result: null,
                                                    error: "Input contains PII in ".concat(variable.name),
                                                })];
                                        }
                                        variableValue = redactedVariableValue;
                                        return [3 /*break*/, 4];
                                    case 3:
                                        variableValue = variableValue !== null && variableValue !== void 0 ? variableValue : variable.defaultValue;
                                        _b.label = 4;
                                    case 4:
                                        // Validate the presence of required parameters
                                        if (variableValue === undefined) {
                                            return [2 /*return*/, res.status(400).json({
                                                    result: null,
                                                    error: "Missing required parameter ".concat(variable.name, " in POST body"),
                                                })];
                                        }
                                        // Replace variables in the prompt with their values
                                        processedPrompt = (0, util_1.replaceVariable)(processedPrompt, variable.name, variableValue);
                                        _b.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 6:
                                        retryCount = 0;
                                        validationResult = { valid: false, errorMessage: null };
                                        result = null;
                                        messages = [];
                                        // Add system message to the conversation if present
                                        if (systemMessage) {
                                            messages.push({ role: "system", content: systemMessage });
                                        }
                                        // Add user message to the conversation
                                        messages.push({ role: "user", content: processedPrompt });
                                        // Log the submitted prompt
                                        payload_1.default.logger.info("Submitting prompt: ".concat(processedPrompt));
                                        _b.label = 7;
                                    case 7: return [4 /*yield*/, openai.createChatCompletion({
                                            model: model,
                                            messages: messages,
                                            temperature: params === null || params === void 0 ? void 0 : params.temperature,
                                            top_p: params === null || params === void 0 ? void 0 : params.top_p,
                                            presence_penalty: params === null || params === void 0 ? void 0 : params.presence_penalty,
                                            frequency_penalty: params === null || params === void 0 ? void 0 : params.frequency_penalty,
                                            logit_bias: (params === null || params === void 0 ? void 0 : params.logit_bias) && typeof params.logit_bias === "object" && Object.keys(params.logit_bias).length > 0 ? params.logit_bias : undefined,
                                        })];
                                    case 8:
                                        completion = _b.sent();
                                        result = (_a = completion.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content.trim();
                                        if (!route.validation.validationEnabled) return [3 /*break*/, 10];
                                        return [4 /*yield*/, (0, util_1.validateOutput)(route.validation.validationFunction, result)];
                                    case 9:
                                        validationResult = _b.sent();
                                        if (validationResult.valid)
                                            return [3 /*break*/, 13];
                                        correctionPrompt = [
                                            { role: "assistant", content: result },
                                            { role: "user", content: validationResult.errorMessage },
                                        ];
                                        if (messages.length <= 2) {
                                            messages = messages.concat(correctionPrompt);
                                        }
                                        else {
                                            // Replace the last two messages to minimize context usage
                                            messages[messages.length - 2] = correctionPrompt[0];
                                            messages[messages.length - 1] = correctionPrompt[1];
                                        }
                                        return [3 /*break*/, 11];
                                    case 10:
                                        validationResult.valid = true;
                                        return [3 /*break*/, 13];
                                    case 11:
                                        // Raise the temperature slightly on each retry
                                        if ((params === null || params === void 0 ? void 0 : params.temperature) && typeof params.temperature === "number") {
                                            params.temperature = Math.min(params.temperature + 0.05, 1);
                                        }
                                        retryCount++;
                                        _b.label = 12;
                                    case 12:
                                        if (retryCount <= route.validation.maxRetries) return [3 /*break*/, 7];
                                        _b.label = 13;
                                    case 13:
                                        // Handle validation failure
                                        if (!validationResult.valid) {
                                            return [2 /*return*/, res.status(400).json({
                                                    result: null,
                                                    error: "Validation failed after ".concat(retryCount, " tries: ").concat(validationResult.errorMessage),
                                                })];
                                        }
                                        // Store the result in the cache if caching is enabled
                                        if (route.caching.cachingEnabled) {
                                            (0, cache_1.addToCache)(cacheKey, { result: result, timestamp: Date.now() });
                                        }
                                        res.status(200).json({ result: result, error: null });
                                        return [3 /*break*/, 15];
                                    case 14:
                                        error_2 = _b.sent();
                                        payload_1.default.logger.error("Error in route /api/".concat(route.name, ": ").concat(error_2));
                                        res.status(500).json({ result: null, error: error_2.message });
                                        return [3 /*break*/, 15];
                                    case 15: return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    payload_1.default.logger.error("Error while setting up dynamic routes: " + error_1.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getRouter() {
    return router;
}
exports.default = { setupDynamicRoutes: setupDynamicRoutes, getRouter: getRouter };
