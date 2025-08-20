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
const port = process.env.PORT_DEFAULT || 2001;
const app = (0, express_1.default)();
app.use('/doc', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routers_1.default);
app.listen(port, async () => {
    console.log(`Server running in port=${port}`);
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
        // Configurar monitoramento com estoque mínimo de 10 e verificação a cada 30 minutos
        EstoqueMonitorService_1.default.iniciarMonitoramento(10, 30 * 60 * 1000);
        console.log('📦 Stock monitoring initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize stock monitoring:', error);
    }
});
//# sourceMappingURL=server.js.map