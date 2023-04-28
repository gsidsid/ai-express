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
exports.replaceVariable = exports.validateOutput = exports.redactPII = exports.createRateLimiter = exports.countTokens = exports.getRouteName = exports.generateSwaggerSpec = exports.apiKeyMiddleware = exports.isRole = exports.stringify = exports.inferVariablesFromPrompt = void 0;
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var redact_pii_1 = require("redact-pii");
var safe_eval_1 = __importDefault(require("safe-eval"));
var serverURL = process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME
    ? "https://".concat(process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME)
    : "http://localhost:3000";
var mongoURL = process.env.PAYLOAD_PUBLIC_MONGODB_URI || "mongodb://localhost/payload";
function getMongoDBDetails() {
    var connectionString = mongoURL;
    var regex = /^mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@(.+)$/;
    var match = connectionString.match(regex);
    if (match) {
        var user = match[1];
        var password = match[2];
        var uri = "mongodb+srv://".concat(match[3]);
        return { user: user, password: password, uri: uri };
    }
    else {
        throw new Error("Invalid MongoDB connection string");
    }
}
/**
 * Infers variables from a text prompt in the format {{variableName}}, with optional description and default value.
 * The description and default value can be added in the format {{variableName|defaultValue|description}}.
 *
 * @param prompt - The text prompt containing variables to be inferred.
 * @returns An array of inferred variables with their properties.
 */
var inferVariablesFromPrompt = function (prompt) {
    var regex = /{{([^}]+)}}/g;
    var match;
    var variables = [];
    while ((match = regex.exec(prompt)) !== null) {
        var variable = match[1];
        var variableInfo = variable.split("|");
        var variableDefinition = {
            name: variableInfo[0],
        };
        if (variableInfo.length > 1) {
            variableDefinition["defaultValue"] = variableInfo[1];
        }
        if (variableInfo.length > 2) {
            variableDefinition["description"] = variableInfo[2];
        }
        variables.push(variableDefinition);
    }
    return variables;
};
exports.inferVariablesFromPrompt = inferVariablesFromPrompt;
/**
 * Converts an object to a string representation within a prompt.
 *
 * @param obj - The object to stringify.
 * @returns The string representation of the object.
 */
var stringify = function (obj) {
    if (obj === null || obj === undefined)
        return "";
    if (typeof obj === "string")
        return obj;
    return JSON.stringify(obj, null, 2);
};
exports.stringify = stringify;
/**
 * Type guard for checking if an object is of type Role.
 *
 * @param role - The object to be checked.
 * @returns True if the object is of type Role, false otherwise.
 */
var isRole = function (role) {
    return role.value !== undefined;
};
exports.isRole = isRole;
/**
 * Middleware to verify API key in request header.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
var apiKeyMiddleware = function (req, res, next) {
    var apiKey = req.headers["x-api-key"];
    if (process.env.AIEXPRESS_API_KEY &&
        (!apiKey || apiKey !== process.env.AIEXPRESS_API_KEY)) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
};
exports.apiKeyMiddleware = apiKeyMiddleware;
/**
 * Generates a Swagger spec JSON object based on the provided prompts.
 * Each prompt is transformed into a POST endpoint, with variables in the prompt being
 * included as POST body parameters. If a variable has a default value, the parameter
 * is treated as optional; otherwise, it is required. The endpoints also include the
 * x-api-key header for authentication.
 *
 * @param prompts - The array of prompts to be used for generating the Swagger spec.
 * @returns The Swagger spec JSON object.
 */
var generateSwaggerSpec = function (prompts) {
    var paths = {};
    var definitions = {};
    prompts.forEach(function (prompt) {
        var variables = inferVariablesFromPrompt(prompt.prompt);
        var properties = variables.reduce(function (acc, variable) {
            var _a, _b;
            acc[variable.name] = {
                type: "string",
                default: (_a = variable.defaultValue) !== null && _a !== void 0 ? _a : "",
                description: (_b = variable.description) !== null && _b !== void 0 ? _b : "",
            };
            return acc;
        }, {});
        var endpointName = "/api/".concat(getRouteName(prompt.name));
        var schemaName = "".concat(prompt.name, " Request Body");
        paths[endpointName] = {
            post: {
                tags: [prompt.name],
                description: prompt.description,
                consumes: ["application/json"],
                produces: ["application/json"],
                parameters: [
                    {
                        name: "body",
                        in: "body",
                        required: true,
                        schema: {
                            $ref: "#/definitions/".concat(schemaName),
                        },
                    },
                ],
                responses: {
                    200: {
                        description: "Success",
                        schema: {
                            type: "object",
                            properties: {
                                result: {
                                    type: "string",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad Request - Missing expected variable",
                        schema: {
                            type: "object",
                            properties: {
                                error: {
                                    type: "string",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal Server Error",
                        schema: {
                            type: "object",
                            properties: {
                                error: {
                                    type: "string",
                                },
                            },
                        },
                    },
                },
                security: [{ apiKeyHeader: [] }],
            },
        };
        definitions[schemaName] = {
            type: "object",
            properties: properties,
        };
    });
    return {
        swagger: "2.0",
        info: {
            version: "1.0.0",
            title: "Language Model API",
            description: "An API for generating text from various prompts.",
        },
        basePath: "",
        schemes: [serverURL.split(":")[0] || "http"],
        securityDefinitions: {
            apiKeyHeader: {
                type: "apiKey",
                in: "header",
                name: "x-api-key",
                description: "API key for authentication",
            },
        },
        paths: paths,
        definitions: definitions,
        security: [{ apiKeyHeader: [] }],
    };
};
exports.generateSwaggerSpec = generateSwaggerSpec;
var countTokens = function (str) {
    // https://platform.openai.com/tokenizer
    return parseInt((str.split(" ").length * (4 / 3)).toString());
};
exports.countTokens = countTokens;
var getRouteName = function (name) {
    return name === null || name === void 0 ? void 0 : name.toLowerCase().replaceAll(" ", "-");
};
exports.getRouteName = getRouteName;
// Helper function for rate limiting
var createRateLimiter = function (route) {
    // timeUnit is "minute", "hour", "day", or "month"
    var timeUnitMs;
    switch (route.rateLimit.timeUnit) {
        case "minute":
            timeUnitMs = 60 * 1000;
            break;
        case "hour":
            timeUnitMs = 60 * 60 * 1000;
            break;
        case "day":
            timeUnitMs = 24 * 60 * 60 * 1000;
            break;
        default:
            throw new Error("Invalid time unit");
    }
    return (0, express_rate_limit_1.default)({
        windowMs: timeUnitMs,
        max: route.rateLimit.requestsPerUnit,
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimiter = createRateLimiter;
// Helper function for PII redaction
var redactPII = function (text) { return __awaiter(void 0, void 0, void 0, function () {
    var redactor;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                redactor = new redact_pii_1.AsyncRedactor();
                return [4 /*yield*/, redactor.redactAsync(text)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.redactPII = redactPII;
// Helper function for output validation
var validateOutput = function (validationFunction, result) {
    var validationResult = (0, safe_eval_1.default)("".concat(validationFunction, "()"), { result: result });
    if (validationResult === true) {
        return { valid: true, errorMessage: null };
    }
    else if (typeof validationResult === "string") {
        return { valid: false, errorMessage: validationResult };
    }
    else if (validationResult === false) {
        return { valid: false, errorMessage: "Invalid output. Please try again." };
    }
    else {
        throw new Error("Invalid output validation function");
    }
};
exports.validateOutput = validateOutput;
var replaceVariable = function (template, variable, value) {
    var regex = new RegExp("{{".concat(variable, "(?:\\|[^}|]+)?(?:\\|[^}]*)?}}"), "g");
    return template.replace(regex, function () { return value; });
};
exports.replaceVariable = replaceVariable;
