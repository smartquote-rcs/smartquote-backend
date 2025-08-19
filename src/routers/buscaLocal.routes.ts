import { Router } from 'express';
import BuscaLocalController from '../controllers/BuscaLocalController';

const router = Router();

// POST /api/busca-local
router.post('/', (req, res) => BuscaLocalController.search(req, res));

export default router;
