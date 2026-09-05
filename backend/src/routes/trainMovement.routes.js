import { Router } from 'express';
import * as opsController from '../controllers/trainOperations.controller.js';

const router = Router();

router.post('/', opsController.createTrainMovement);
router.get('/', opsController.getTrainMovements);
router.get('/:id', opsController.getTrainMovementById);

export default router;
