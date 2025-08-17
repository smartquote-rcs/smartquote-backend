import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';

const router = Router();

// CRUD básico de notificações
router.post('/', NotificationController.create);
router.get('/', NotificationController.getAll);
router.get('/:id', NotificationController.getById);
router.patch('/:id', NotificationController.update);
router.delete('/:id', NotificationController.delete);

// Rotas específicas para monitoramento de estoque
router.post('/verificar-estoque', NotificationController.verificarEstoqueBaixo);
router.post('/verificacao-automatica', NotificationController.verificacaoAutomatica);
router.delete('/limpar-obsoletas', NotificationController.limparNotificacoesObsoletas);

export default router;
