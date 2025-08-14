import { Router } from 'express';
import FornecedoresController from '../controllers/FornecedoresController';

const router = Router();
 
router.post('/', FornecedoresController.create);
router.get('/', FornecedoresController.getAll);
router.get('/:id', FornecedoresController.getById);
router.patch('/:id', FornecedoresController.patch);
router.delete('/:id', FornecedoresController.delete);

export default router;
