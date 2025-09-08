"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PromptsService_1 = __importDefault(require("../services/PromptsService"));
const PromptSchema_1 = require("../schemas/PromptSchema");
class PromptsController {
    async create(req, res) {
        const parsed = PromptSchema_1.promptSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.format() });
        }
        try {
            const prompt = await PromptsService_1.default.create(parsed.data);
            return res.status(201).json(prompt);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const prompts = await PromptsService_1.default.getAll();
            return res.status(200).json(prompts);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const prompt = await PromptsService_1.default.getById(Number(id));
            if (!prompt) {
                return res.status(404).json({ message: 'Prompt not found' });
            }
            return res.status(200).json(prompt);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async update(req, res) {
        const { id } = req.params;
        const parsed = PromptSchema_1.updatePromptSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.format() });
        }
        try {
            const prompt = await PromptsService_1.default.update(Number(id), parsed.data);
            return res.status(200).json(prompt);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await PromptsService_1.default.delete(Number(id));
            return res.status(204).send();
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getAllWithDadosBruto(req, res) {
        try {
            const prompts = await PromptsService_1.default.getAllWithDadosBruto();
            return res.status(200).json(prompts);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new PromptsController();
//# sourceMappingURL=PromptsController.js.map