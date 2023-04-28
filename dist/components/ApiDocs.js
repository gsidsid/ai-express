"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var react_2 = require("react");
var apiKey = process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;
var Docs;
var ApiDocs = function () {
    var _a = (0, react_1.useState)(false), copied = _a[0], setCopied = _a[1];
    Docs = Docs || (0, react_2.lazy)(function () { return Promise.resolve().then(function () { return __importStar(require("./Swagger.js")); }); });
    var copyToClipboard = function (e) {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(function () {
            setCopied(false);
        }, 2000);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("header", null,
            react_1.default.createElement("h2", { style: { marginTop: "1rem", marginBottom: "0.25rem" } }, "Your API"),
            react_1.default.createElement("p", null, apiKey
                ? "All requests to prompt-based endpoints must include an x-api-key header matching your AIEXPRESS_API_KEY environment variable (copy below)."
                : "AIEXPRESS_API_KEY is not set as an environment variable. Anyone can access your API."),
            react_1.default.createElement("button", { style: { marginTop: "0rem", marginBottom: "2.5rem" }, className: "btn btn--style-primary btn--icon-style-without-border btn--size-small btn--icon-position-right " +
                    (!apiKey || copied ? "btn--disabled" : ""), id: "action-copy-key", name: "key", onClick: copyToClipboard }, copied ? "Copied!" : "Copy API Key")),
        react_1.default.createElement("div", { style: { marginLeft: "-1.5rem" } },
            react_1.default.createElement(react_2.Suspense, { fallback: react_1.default.createElement(react_1.default.Fragment, null) },
                react_1.default.createElement(Docs, null)))));
};
exports.default = ApiDocs;
