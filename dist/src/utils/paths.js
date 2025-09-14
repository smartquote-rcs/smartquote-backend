"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRoot = getProjectRoot;
exports.getDataDir = getDataDir;
exports.getDataPath = getDataPath;
exports.ensureDir = ensureDir;
exports.getLocksDir = getLocksDir;
exports.getWorkerMessagesFile = getWorkerMessagesFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Encontra a raiz do projeto procurando por package.json subindo alguns níveis
function findProjectRoot(startDir) {
    let dir = startDir;
    for (let i = 0; i < 6; i++) {
        const pkg = path_1.default.join(dir, 'package.json');
        if (fs_1.default.existsSync(pkg))
            return dir;
        const parent = path_1.default.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return startDir; // fallback
}
function getProjectRoot() {
    // __dirname será src/... em dev e dist/src/... em build
    return findProjectRoot(__dirname);
}
function getDataDir() {
    return path_1.default.join(getProjectRoot(), 'src', 'data');
}
function getDataPath(...segments) {
    return path_1.default.join(getDataDir(), ...segments);
}
function ensureDir(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
function getLocksDir() {
    const dir = path_1.default.join(getDataDir(), '.locks');
    ensureDir(dir);
    return dir;
}
function getWorkerMessagesFile() {
    const dir = path_1.default.join(getDataDir(), 'worker-messages');
    ensureDir(dir);
    return path_1.default.join(dir, 'messages.json');
}
//# sourceMappingURL=paths.js.map