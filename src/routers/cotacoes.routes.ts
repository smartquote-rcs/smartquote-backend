import { Router } from 'express';
import CotacoesController from '../controllers/Cotacoes.controller';

const router = Router();
 
router.post('/', CotacoesController.create);

 
router.get('/', CotacoesController.getAll);

 
router.get('/:id', CotacoesController.getById);

 
router.patch('/:id', CotacoesController.patch);

 
router.delete('/:id', CotacoesController.delete);

export default router;
