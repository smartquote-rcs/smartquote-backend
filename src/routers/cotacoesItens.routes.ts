import { Router } from 'express';
import CotacoesItensController from '../controllers/CotacoesItensController';

const router = Router();

router.get('/', CotacoesItensController.list);
router.get('/:id', CotacoesItensController.get);
router.put('/replace-product', CotacoesItensController.replaceProduct);
router.post('/add', CotacoesItensController.add);
router.get('/sugeridos/web/:id', CotacoesItensController.getSugeridosWeb);
router.get('/sugeridos/local/:id', CotacoesItensController.getSugeridosLocal);
export default router;
