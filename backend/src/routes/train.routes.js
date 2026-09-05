import { Router } from 'express';
import * as opsController from '../controllers/trainOperations.controller.js';

const router = Router();

router.post('/', opsController.createTrain);
router.get('/', opsController.getTrains);
router.get('/:id', opsController.getTrainById);
router.patch('/:id', opsController.updateTrain);

export default router;
