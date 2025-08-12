"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = __importDefault(require("../controllers/UserController"));
const userRouter = (0, express_1.Router)();
userRouter.get("/", UserController_1.default.getAll);
userRouter.get("/:id", UserController_1.default.getById);
userRouter.post("/create", UserController_1.default.create);
userRouter.delete("/:id", UserController_1.default.delete);
userRouter.patch("/:id", UserController_1.default.patch);
exports.default = userRouter;
//# sourceMappingURL=users.route.js.map