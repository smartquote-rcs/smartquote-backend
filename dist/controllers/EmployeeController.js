"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmployeeSchema_1 = require("../schemas/EmployeeSchema");
const EmployeeService_1 = __importDefault(require("../services/EmployeeService"));
class EmployeeController {
    async create(req, res) {
        const parsed = EmployeeSchema_1.employeeSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const employee = await EmployeeService_1.default.create(parsed.data);
            return res.status(201).json({
                message: 'Funcionário cadastrado com sucesso.',
                user: employee,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const employees = await EmployeeService_1.default.getAll();
            return res.status(200).json({
                message: 'Lista de funcionários.',
                data: employees,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const employee = await EmployeeService_1.default.getById(String(id));
            return res.status(200).json({
                message: 'funcionário.',
                data: employee,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await EmployeeService_1.default.delete(String(id));
            return res.status(200).json({ message: 'Funcionário deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const updatedEmployee = await EmployeeService_1.default.updatePartial(String(id), updates);
            return res.status(200).json({
                message: 'Funcionário atualizado com sucesso.',
                data: updatedEmployee,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new EmployeeController();
//# sourceMappingURL=EmployeeController.js.map