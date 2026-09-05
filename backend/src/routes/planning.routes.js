import { Router } from 'express';
import { handleGeneratePlan } from '../controllers/planning.controller.js';

const router = Router();

router.post('/generate', handleGeneratePlan);

export default router;
