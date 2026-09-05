import * as opsService from '../services/trainOperations.service.js';

// --- TRAINS ---

export const createTrain = async (req, res, next) => {
  try {
    const data = await opsService.createTrain(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrains = async (req, res, next) => {
  try {
    const data = await opsService.getTrains(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrainById = async (req, res, next) => {
  try {
    const data = await opsService.getTrainById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateTrain = async (req, res, next) => {
  try {
    const data = await opsService.updateTrain(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// --- TRAIN ROUTES ---

export const createTrainRoute = async (req, res, next) => {
  try {
    const data = await opsService.createTrainRoute(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrainRoutes = async (req, res, next) => {
  try {
    const data = await opsService.getTrainRoutes(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrainRouteById = async (req, res, next) => {
  try {
    const data = await opsService.getTrainRouteById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// --- TRAIN MOVEMENTS ---

export const createTrainMovement = async (req, res, next) => {
  try {
    const data = await opsService.createTrainMovement(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrainMovements = async (req, res, next) => {
  try {
    const data = await opsService.getTrainMovements(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrainMovementById = async (req, res, next) => {
  try {
    const data = await opsService.getTrainMovementById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// --- FREIGHT FORECASTS ---

export const createFreightForecast = async (req, res, next) => {
  try {
    const data = await opsService.createFreightForecast(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getFreightForecasts = async (req, res, next) => {
  try {
    const data = await opsService.getFreightForecasts(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// --- CORRIDOR AVAILABILITY ---

export const createCorridorAvailability = async (req, res, next) => {
  try {
    const data = await opsService.createCorridorAvailability(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getCorridorAvailability = async (req, res, next) => {
  try {
    const data = await opsService.calculateCorridorAvailability(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
