import { Router } from 'express';
import ProdutosController from '../controllers/ProdutosController';
import multer from 'multer';

// Multer em memória para enviar buffer direto ao Supabase
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();


router.post('/', ProdutosController.create);

// Upload de imagem de produto (retorna URL para usar em image_url)
router.post('/upload-imagem', upload.single('imagem'), (req, res) => ProdutosController.uploadImagem(req as any, res));


router.get('/', ProdutosController.getAll);


router.get('/:id', ProdutosController.getById);


router.patch('/:id', ProdutosController.patch);


router.delete('/:id', ProdutosController.delete);

export default router;
