import  dotenv from "dotenv";
dotenv.config();
import express from "express";
import routers from "./routers";
import cors from "cors"
import swaggerUI from 'swagger-ui-express';
import swaggerDocumentation from './swagger.json';
import GlobalEmailMonitorManager from './services/GlobalEmailMonitorManager';

const port = process.env.PORT_DEFAULT || 2001
const app = express();

app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocumentation));

app.use(cors());
app.use(express.json());

app.use("/api",routers);

// Inicializar monitoramento automático de emails
const initializeEmailMonitoring = async () => {
  try {
    console.log('🚀 [SERVIDOR] Inicializando monitoramento automático de emails...');
    const monitor = GlobalEmailMonitorManager.getInstance();
    await monitor.initializeAutoMonitoring();
  } catch (error) {
    console.error('❌ [SERVIDOR] Erro ao inicializar monitoramento de emails:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('📤 [SERVIDOR] Recebido sinal de shutdown...');
  
  try {
    const monitor = GlobalEmailMonitorManager.getInstance();
    await monitor.gracefulShutdown();
    console.log('✅ [SERVIDOR] Shutdown concluído');
    process.exit(0);
  } catch (error) {
    console.error('❌ [SERVIDOR] Erro durante shutdown:', error);
    process.exit(1);
  }
};

// Capturar sinais de shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(port, async ()=>{
  console.log(`Server running in port=${port}`);
  
  // Aguardar um pouco para o servidor estabilizar, depois iniciar monitoramento
  setTimeout(initializeEmailMonitoring, 2000);
});