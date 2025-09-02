import  dotenv from "dotenv";
dotenv.config();
import express from "express";
import routers from "./routers";
import cors from "cors"
import swaggerUI from 'swagger-ui-express';
import swaggerDocumentation from './swagger.json';
import GlobalEmailMonitorManager from './services/GlobalEmailMonitorManager';
import EstoqueMonitorService from './services/EstoqueMonitorService';
import { removerCotacoesExpiradasHoje } from './services/RemoveExpiredCotacoes';

const port = process.env.PORT_DEFAULT || 2001
const app = express();

app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocumentation));

app.use(cors());
app.use(express.json());

app.use("/api",routers);

app.listen(port, async ()=>{
  console.log(`Server running in port=${port}`);

  // Remover cotações expiradas (prazo_validade igual à data atual)
  try {
    await removerCotacoesExpiradasHoje();
    console.log('🗑️ Cotações expiradas removidas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao remover cotações expiradas:', error);
  }

  // Inicializar monitoramento de email automaticamente
  try {
    const globalMonitor = GlobalEmailMonitorManager.getInstance();
    await globalMonitor.initializeAutoMonitoring();
    console.log('📧 Email monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize email monitoring:', error);
  }

  // Inicializar monitoramento de estoque automaticamente
  try {
    // Configurar monitoramento com estoque mínimo de 10 e verificação a cada 30 minutos
    EstoqueMonitorService.iniciarMonitoramento(10, 30 * 60 * 1000);
    console.log('📦 Stock monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize stock monitoring:', error);
  }
});