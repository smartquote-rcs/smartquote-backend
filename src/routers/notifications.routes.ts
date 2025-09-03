import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';

const router = Router();

// CRUD básico de notificações
router.post('/', NotificationController.create);
router.get('/', NotificationController.getAll);
router.get('/:id', NotificationController.getById);
router.patch('/:id', NotificationController.update);
router.delete('/:id', NotificationController.delete);

// Rotas para notificações não lidas
router.get('/unread/list', NotificationController.getUnread);
router.get('/unread/count', NotificationController.countUnread);

// Rotas para marcar como lida
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read/multiple', NotificationController.markMultipleAsRead);
router.patch('/read/all', NotificationController.markAllAsRead);

// Rotas específicas para monitoramento de estoque
router.post('/verificar-estoque', NotificationController.verificarEstoqueBaixo);
router.post('/verificacao-automatica', NotificationController.verificacaoAutomatica);
router.delete('/limpar-obsoletas', NotificationController.limparNotificacoesObsoletas);

export default router;
