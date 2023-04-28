"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = exports.Logo = void 0;
var react_1 = __importDefault(require("react"));
var Logo = function () { return (react_1.default.createElement("div", { className: "logo" },
    react_1.default.createElement("img", { src: "/assets/logo.svg", alt: "AI Express Logo" }))); };
exports.Logo = Logo;
var Icon = function () { return (react_1.default.createElement("div", { className: "icon" },
    react_1.default.createElement("img", { src: "/assets/icon.svg", alt: "AI Express Icon" }))); };
exports.Icon = Icon;
