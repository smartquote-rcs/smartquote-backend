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

app.listen(port, async ()=>{
  console.log(`Server running in port=${port}`);
  
  // Inicializar monitoramento de email automaticamente
  try {
    const globalMonitor = GlobalEmailMonitorManager.getInstance();
    await globalMonitor.initializeAutoMonitoring();
    console.log('📧 Email monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize email monitoring:', error);
  }
});