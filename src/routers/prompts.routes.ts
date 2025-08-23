import { Router } from 'express';
import PromptsController from '../controllers/PromptsController';

const promptsRouter = Router();

promptsRouter.post('/', PromptsController.create);
promptsRouter.get('/', PromptsController.getAll);
promptsRouter.get('/:id', PromptsController.getById);
promptsRouter.patch('/:id', PromptsController.update);
promptsRouter.delete('/:id', PromptsController.delete);

export default promptsRouter;
