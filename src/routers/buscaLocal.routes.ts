import { Router } from 'express';
import BuscaLocalController from '../controllers/BuscaLocalController';

const router = Router();

// POST /api/busca
router.post('/geral', (req, res) => BuscaLocalController.search(req, res));
router.post('/local', (req, res) => BuscaLocalController.searchLocal(req, res));
export default router;
