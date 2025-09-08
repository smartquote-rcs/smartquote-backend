"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProdutosController_1 = __importDefault(require("../controllers/ProdutosController"));
const multer_1 = __importDefault(require("multer"));
// Multer em memória para enviar buffer direto ao Supabase
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.post('/', ProdutosController_1.default.create);
// Upload de imagem de produto (retorna URL para usar em image_url)
router.post('/upload-imagem', upload.single('imagem'), (req, res) => ProdutosController_1.default.uploadImagem(req, res));
router.get('/', ProdutosController_1.default.getAll);
router.get('/:id', ProdutosController_1.default.getById);
router.patch('/:id', ProdutosController_1.default.patch);
router.delete('/:id', ProdutosController_1.default.delete);
exports.default = router;
//# sourceMappingURL=produtos.routes.js.map