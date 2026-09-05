import { Router } from 'express';
import * as jobController from '../controllers/maintenanceJob.controller.js';

const router = Router();

router.post('/', jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.patch('/:id', jobController.updateJob);

export default router;
