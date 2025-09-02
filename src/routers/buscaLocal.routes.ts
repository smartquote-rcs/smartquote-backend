import { Router } from 'express';
import BuscaLocalController from '../controllers/BuscaLocalController';

const router = Router();

// POST /api/busca
router.post('/geral', (req, res) => BuscaLocalController.search(req, res));
router.post('/local', (req, res) => BuscaLocalController.searchLocal(req, res));

// Novos endpoints para API Python
router.get('/python-api/health', (req, res) => BuscaLocalController.checkPythonApiHealth(req, res));
router.post('/python-api/sync-products', (req, res) => BuscaLocalController.syncProducts(req, res));

export default router;
