"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordHash = passwordHash;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function passwordHash(senha) {
    const saltRounds = 10;
    const hash = await bcrypt_1.default.hash(senha, saltRounds);
    return hash;
}
//# sourceMappingURL=passwordHash.js.map