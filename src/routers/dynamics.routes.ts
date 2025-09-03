import { Router } from 'express';
import DynamicsController from '../controllers/DynamicsController';

const dynamicsRouter = Router();

// Rotas para gerenciar integração com Dynamics 365

// Testes de conectividade
dynamicsRouter.get('/test-connection', DynamicsController.testarConexao);
dynamicsRouter.get('/environment-info', DynamicsController.obterInformacoesAmbiente);

// Configurações
dynamicsRouter.get('/config', DynamicsController.obterConfiguracoes);
dynamicsRouter.patch('/config', DynamicsController.atualizarConfiguracoes);

// Operações com cotações
dynamicsRouter.post('/send-cotacao/:id', DynamicsController.enviarCotacao);
dynamicsRouter.post('/sync-approved', DynamicsController.sincronizarCotacoesAprovadas);

export default dynamicsRouter;
