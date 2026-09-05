import { Router } from 'express';
import {
  handleGetStations,
  handleGetSections,
  handleGetAssets
} from '../controllers/network.controller.js';

const router = Router();

router.get('/stations', handleGetStations);
router.get('/sections', handleGetSections);
router.get('/assets', handleGetAssets);

export default router;
