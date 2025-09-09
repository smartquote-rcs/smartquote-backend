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

// Usar a porta fornecida pelo provedor (ex.: Render) quando em produção,
// com fallbacks para PORT_DEFAULT e, por fim, 2001.
const port = (process.env.PORT as unknown as string) || process.env.PORT_DEFAULT || 2001
const app = express();

app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocumentation));

app.use(cors());
app.use(express.json());

app.use("/api",routers);

//usar para receber pig no servidor com o method head
app.use("", (req, res, next) => {
    if (req.method === "HEAD") {
        res.status(200).end();
    } else {
        next();
    }
});

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
    const estoqueMonitor = new EstoqueMonitorService();
    // Configurar monitoramento com estoque mínimo de 10 e verificação a cada 30 minutos (1800000 ms)
    estoqueMonitor.iniciarMonitoramento(10, 30 * 60 * 1000);
    console.log('📦 Stock monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize stock monitoring:', error);
  }
});