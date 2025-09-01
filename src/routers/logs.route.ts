import { Router } from 'express'; 
import { LogService } from '../services/LogService';

const LogRouter = Router();

 
LogRouter.get('/', async (req, res)=> {
    try {
      const notifications = await (new LogService).getAll();

    res.status(200).json({
        message: 'Lista de logs.',
        data: notifications,
      });
    } catch (err: any) {
       res.status(500).json({ error: err.message });
    }
  });  

export default LogRouter;
