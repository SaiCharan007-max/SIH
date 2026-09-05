import { Router } from 'express';
import * as opsController from '../controllers/trainOperations.controller.js';

const router = Router();

router.post('/', opsController.createTrainRoute);
router.get('/', opsController.getTrainRoutes);
router.get('/:id', opsController.getTrainRouteById);

export default router;
