import { Router } from 'express';
import * as priorityController from '../controllers/priority.controller.js';

const router = Router();

router.get('/', priorityController.getPriorities);

export default router;
