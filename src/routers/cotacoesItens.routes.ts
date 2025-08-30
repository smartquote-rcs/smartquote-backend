import { Router } from 'express';
import CotacoesItensController from '../controllers/CotacoesItensController';

const router = Router();

router.get('/', CotacoesItensController.list);
router.get('/:id', CotacoesItensController.get);
router.put('/replace-product', CotacoesItensController.replaceProduct);
router.post('/add', CotacoesItensController.add);

export default router;
