"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeeController_1 = __importDefault(require("../controllers/EmployeeController"));
const employeeRouter = (0, express_1.Router)();
employeeRouter.get("/", EmployeeController_1.default.getAll);
employeeRouter.get("/:id", EmployeeController_1.default.getById);
employeeRouter.post("/create", EmployeeController_1.default.create);
employeeRouter.delete("/:id", EmployeeController_1.default.delete);
employeeRouter.patch("/:id", EmployeeController_1.default.patch);
exports.default = employeeRouter;
//# sourceMappingURL=employee.route.js.map