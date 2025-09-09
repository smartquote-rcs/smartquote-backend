"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const routers_1 = __importDefault(require("./routers"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const GlobalEmailMonitorManager_1 = __importDefault(require("./services/GlobalEmailMonitorManager"));
const EstoqueMonitorService_1 = __importDefault(require("./services/EstoqueMonitorService"));
const RemoveExpiredCotacoes_1 = require("./services/RemoveExpiredCotacoes");
// Usar a porta fornecida pelo provedor (ex.: Render) quando em produção,
// com fallbacks para PORT_DEFAULT e, por fim, 2001.
const port = process.env.PORT || process.env.PORT_DEFAULT || 2001;
const app = (0, express_1.default)();
app.use('/doc', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routers_1.default);
//usar para receber pig no servidor com o method head
app.use("", (req, res, next) => {
    if (req.method === "HEAD") {
        res.status(200).end();
    }
    else {
        next();
    }
});
app.listen(port, async () => {
    console.log(`Server running in port=${port}`);
    // Remover cotações expiradas (prazo_validade igual à data atual)
    try {
        await (0, RemoveExpiredCotacoes_1.removerCotacoesExpiradasHoje)();
        console.log('🗑️ Cotações expiradas removidas com sucesso');
    }
    catch (error) {
        console.error('❌ Erro ao remover cotações expiradas:', error);
    }
    // Inicializar monitoramento de email automaticamente
    try {
        const globalMonitor = GlobalEmailMonitorManager_1.default.getInstance();
        await globalMonitor.initializeAutoMonitoring();
        console.log('📧 Email monitoring initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize email monitoring:', error);
    }
    // Inicializar monitoramento de estoque automaticamente
    try {
        const estoqueMonitor = new EstoqueMonitorService_1.default();
        // Configurar monitoramento com estoque mínimo de 10 e verificação a cada 30 minutos (1800000 ms)
        estoqueMonitor.iniciarMonitoramento(10, 30 * 60 * 1000);
        console.log('📦 Stock monitoring initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize stock monitoring:', error);
    }
});
//# sourceMappingURL=server.js.map