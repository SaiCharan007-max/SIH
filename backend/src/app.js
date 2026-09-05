import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.routes.js';
import maintenanceJobRouter from './routes/maintenanceJob.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/maintenance/jobs', maintenanceJobRouter);

// Centralized error handling
app.use(errorHandler);

export default app;

