import { Router } from 'express';
import * as opsController from '../controllers/trainOperations.controller.js';

const router = Router();

router.post('/', opsController.createFreightForecast);
router.get('/', opsController.getFreightForecasts);

export default router;
