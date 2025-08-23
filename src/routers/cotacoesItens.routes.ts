import { Router } from 'express';
import CotacoesItensController from '../controllers/CotacoesItensController';

const router = Router();

router.get('/', CotacoesItensController.list);
router.get('/:id', CotacoesItensController.get);


export default router;
