import { Router } from 'express';
import CotacoesController from '../controllers/CotacoesController';

const router = Router();
 
router.post('/', CotacoesController.create);

 
router.get('/', CotacoesController.getAll);

 
router.get('/:id', CotacoesController.getById);

 
router.patch('/:id', CotacoesController.patch);

 
router.delete('/:id', CotacoesController.delete);

// Nova rota para remover elementos faltantes
router.post('/:id/remove-faltante', CotacoesController.removeFaltante);

export default router;
