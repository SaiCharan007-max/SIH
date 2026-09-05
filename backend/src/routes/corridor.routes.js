import { Router } from 'express';
import * as opsController from '../controllers/trainOperations.controller.js';

const router = Router();

router.get('/availability', opsController.getCorridorAvailability);
router.post('/availability', opsController.createCorridorAvailability);

export default router;
