"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceConfig = getServiceConfig;
exports.loadRuntimeConfig = loadRuntimeConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
let configInstance = null;
function getServiceConfig() {
    if (configInstance)
        return configInstance;
    configInstance = {
        logLevel: process.env.LOG_LEVEL || 'info',
        runtimeMode: process.env.ORGAN_RUNTIME_MODE || 'analysis',
        runtimeConfigPath: process.env.ORGAN_RUNTIME_CONFIG ||
            path_1.default.resolve(process.cwd(), 'config', 'runtime.json'),
    };
    return configInstance;
}
function loadRuntimeConfig(configPath) {
    const resolved = path_1.default.isAbsolute(configPath)
        ? configPath
        : path_1.default.resolve(process.cwd(), configPath);
    if (!fs_1.default.existsSync(resolved)) {
        throw new Error(`Organ runtime config not found: ${resolved}\n` +
            `Copy organ-runtime/config/runtime.example.json to ${resolved} and fill in the current operating truth.`);
    }
    const raw = fs_1.default.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
}
