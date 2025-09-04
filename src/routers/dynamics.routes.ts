
import { Router } from 'express';
import DynamicsController from '../controllers/DynamicsController';

const dynamicsRouter = Router();
// Oportunidades
dynamicsRouter.get('/oportunidades', DynamicsController.listarOportunidades.bind(DynamicsController));

// Rotas para gerenciar integração com Dynamics 365

// Testes de conectividade
dynamicsRouter.get('/test-connection', DynamicsController.testarConexao.bind(DynamicsController));
dynamicsRouter.get('/environment-info', DynamicsController.obterInformacoesAmbiente.bind(DynamicsController));
dynamicsRouter.get('/entities', DynamicsController.consultarEntidadesPadrao.bind(DynamicsController));
dynamicsRouter.get('/available-entities', DynamicsController.consultarEntidadesDisponiveis.bind(DynamicsController));
dynamicsRouter.get('/all-entities', DynamicsController.listarTodasEntidades.bind(DynamicsController));

// Configurações
dynamicsRouter.get('/config', DynamicsController.obterConfiguracoes.bind(DynamicsController));
dynamicsRouter.patch('/config', DynamicsController.atualizarConfiguracoes.bind(DynamicsController));

// Operações com cotações
dynamicsRouter.post('/send-cotacao/:id', DynamicsController.enviarCotacao.bind(DynamicsController));
dynamicsRouter.post('/sync-approved', DynamicsController.sincronizarCotacoesAprovadas.bind(DynamicsController));

export default dynamicsRouter;
