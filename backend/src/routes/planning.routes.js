import { Router } from 'express';
import {
  handleGeneratePlan,
  handleReplan,
  handleGetRuns,
  handleGetRunById,
  handleCompareRuns
} from '../controllers/planning.controller.js';

const router = Router();

router.post('/generate', handleGeneratePlan);
router.post('/replan', handleReplan);
router.get('/runs', handleGetRuns);
router.get('/runs/:id', handleGetRunById);
router.get('/runs/:id/compare/:otherRunId', handleCompareRuns);

export default router;
