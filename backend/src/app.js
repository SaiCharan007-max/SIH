import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.routes.js';
import maintenanceJobRouter from './routes/maintenanceJob.routes.js';
import trainRouter from './routes/train.routes.js';
import trainRouteRouter from './routes/trainRoute.routes.js';
import trainMovementRouter from './routes/trainMovement.routes.js';
import freightForecastRouter from './routes/freightForecast.routes.js';
import corridorRouter from './routes/corridor.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/maintenance/jobs', maintenanceJobRouter);
app.use('/api/trains', trainRouter);
app.use('/api/train-routes', trainRouteRouter);
app.use('/api/train-movements', trainMovementRouter);
app.use('/api/freight-forecasts', freightForecastRouter);
app.use('/api/corridor', corridorRouter);

// Centralized error handling
app.use(errorHandler);

export default app;

