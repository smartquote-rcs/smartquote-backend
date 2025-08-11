import { Router } from 'express';
import ProdutosController from '../controllers/produto.controller';

const router = Router();


router.post('/', ProdutosController.create);


router.get('/', ProdutosController.getAll);


router.get('/:id', ProdutosController.getById);


router.patch('/:id', ProdutosController.patch);


router.delete('/:id', ProdutosController.delete);

export default router;
