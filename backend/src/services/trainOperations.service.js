import * as opsRepo from '../repositories/trainOperations.repository.js';

const VALID_TRAIN_TYPES = ['PASSENGER', 'EXPRESS', 'SUPERFAST', 'FREIGHT', 'OTHER'];
const VALID_TRAIN_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
const VALID_MOVEMENT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'];
const VALID_CORRIDOR_STATUSES = ['AVAILABLE', 'RESTRICTED', 'UNAVAILABLE'];

// --- TRAINS ---

export const createTrain = async (payload) => {
  const { train_number, name, train_type, priority, source_station_id, destination_station_id } = payload;

  if (!train_number || typeof train_number !== 'string' || !train_number.trim()) {
    const err = new Error('train_number is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('name is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }

  if (!train_type || !VALID_TRAIN_TYPES.includes(train_type)) {
    const err = new Error(`Invalid train_type. Allowed: ${VALID_TRAIN_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (priority && !VALID_TRAIN_PRIORITIES.includes(priority)) {
    const err = new Error(`Invalid priority. Allowed: ${VALID_TRAIN_PRIORITIES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (!source_station_id || !destination_station_id) {
    const err = new Error('source_station_id and destination_station_id are required');
    err.statusCode = 400;
    throw err;
  }

  if (source_station_id === destination_station_id) {
    const err = new Error('source_station_id and destination_station_id must not be the same');
    err.statusCode = 400;
    throw err;
  }

  const [srcStation, destStation] = await Promise.all([
    opsRepo.findStationById(source_station_id),
    opsRepo.findStationById(destination_station_id)
  ]);

  if (!srcStation) {
    const err = new Error(`Source station with ID "${source_station_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  if (!destStation) {
    const err = new Error(`Destination station with ID "${destination_station_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  const existing = await opsRepo.findTrainByNumber(train_number);
  if (existing) {
    const err = new Error(`Train with train_number "${train_number}" already exists`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.insertTrain(payload);
};

export const getTrains = async (filters) => {
  return opsRepo.findTrains(filters);
};

export const getTrainById = async (id) => {
  const train = await opsRepo.findTrainById(id);
  if (!train) {
    const err = new Error(`Train with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return train;
};

export const updateTrain = async (id, payload) => {
  const train = await opsRepo.findTrainById(id);
  if (!train) {
    const err = new Error(`Train with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }

  if (payload.train_type && !VALID_TRAIN_TYPES.includes(payload.train_type)) {
    const err = new Error(`Invalid train_type. Allowed: ${VALID_TRAIN_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (payload.priority && !VALID_TRAIN_PRIORITIES.includes(payload.priority)) {
    const err = new Error(`Invalid priority. Allowed: ${VALID_TRAIN_PRIORITIES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.updateTrain(id, payload);
};

// --- TRAIN ROUTES ---

export const createTrainRoute = async (payload) => {
  const { train_id, route_name, service_date } = payload;

  if (!train_id) {
    const err = new Error('train_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!route_name || typeof route_name !== 'string' || !route_name.trim()) {
    const err = new Error('route_name is required');
    err.statusCode = 400;
    throw err;
  }

  if (!service_date) {
    const err = new Error('service_date is required (YYYY-MM-DD)');
    err.statusCode = 400;
    throw err;
  }

  const train = await opsRepo.findTrainById(train_id);
  if (!train) {
    const err = new Error(`Referenced train with ID "${train_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.insertTrainRoute(payload);
};

export const getTrainRoutes = async (filters) => {
  return opsRepo.findTrainRoutes(filters);
};

export const getTrainRouteById = async (id) => {
  const route = await opsRepo.findTrainRouteById(id);
  if (!route) {
    const err = new Error(`Train route with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return route;
};

// --- TRAIN MOVEMENTS ---

export const createTrainMovement = async (payload) => {
  const {
    train_route_id,
    section_id,
    sequence_number,
    entry_time,
    exit_time,
    scheduled_entry_time,
    scheduled_exit_time,
    actual_entry_time,
    actual_exit_time,
    status
  } = payload;

  if (!train_route_id) {
    const err = new Error('train_route_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!section_id) {
    const err = new Error('section_id is required');
    err.statusCode = 400;
    throw err;
  }

  const seq = Number(sequence_number);
  if (!Number.isInteger(seq) || seq <= 0) {
    const err = new Error('sequence_number must be an integer greater than 0');
    err.statusCode = 400;
    throw err;
  }

  if (!entry_time || !exit_time) {
    const err = new Error('entry_time and exit_time are required');
    err.statusCode = 400;
    throw err;
  }

  const entryDate = new Date(entry_time);
  const exitDate = new Date(exit_time);
  if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
    const err = new Error('Invalid timestamp format for entry_time or exit_time');
    err.statusCode = 400;
    throw err;
  }

  if (entryDate >= exitDate) {
    const err = new Error('entry_time must be strictly before exit_time');
    err.statusCode = 400;
    throw err;
  }

  const schedEntry = new Date(scheduled_entry_time || entry_time);
  const schedExit = new Date(scheduled_exit_time || exit_time);
  if (schedEntry >= schedExit) {
    const err = new Error('scheduled_entry_time must be strictly before scheduled_exit_time');
    err.statusCode = 400;
    throw err;
  }

  if (actual_entry_time && actual_exit_time) {
    if (new Date(actual_entry_time) > new Date(actual_exit_time)) {
      const err = new Error('actual_exit_time cannot precede actual_entry_time');
      err.statusCode = 400;
      throw err;
    }
  }

  if (status && !VALID_MOVEMENT_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_MOVEMENT_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const [route, section] = await Promise.all([
    opsRepo.findTrainRouteById(train_route_id),
    opsRepo.findSectionById(section_id)
  ]);

  if (!route) {
    const err = new Error(`Train route with ID "${train_route_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  if (!section) {
    const err = new Error(`Railway section with ID "${section_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.insertTrainMovement({
    ...payload,
    sequence_number: seq,
    entry_time: entryDate.toISOString(),
    exit_time: exitDate.toISOString(),
    scheduled_entry_time: schedEntry.toISOString(),
    scheduled_exit_time: schedExit.toISOString()
  });
};

export const getTrainMovements = async (filters) => {
  return opsRepo.findTrainMovements(filters);
};

export const getTrainMovementById = async (id) => {
  const movement = await opsRepo.findTrainMovementById(id);
  if (!movement) {
    const err = new Error(`Train movement with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return movement;
};

// --- FREIGHT FORECASTS ---

export const createFreightForecast = async (payload) => {
  const { section_id, forecast_date, expected_entry_time, expected_exit_time, expected_train_count, confidence, source } = payload;

  if (!section_id) {
    const err = new Error('section_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!forecast_date) {
    const err = new Error('forecast_date is required');
    err.statusCode = 400;
    throw err;
  }

  if (!expected_entry_time || !expected_exit_time) {
    const err = new Error('expected_entry_time and expected_exit_time are required');
    err.statusCode = 400;
    throw err;
  }

  const entry = new Date(expected_entry_time);
  const exit = new Date(expected_exit_time);
  if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
    const err = new Error('Invalid expected_entry_time or expected_exit_time timestamp format');
    err.statusCode = 400;
    throw err;
  }

  if (entry >= exit) {
    const err = new Error('expected_entry_time must precede expected_exit_time');
    err.statusCode = 400;
    throw err;
  }

  const count = Number(expected_train_count ?? 1);
  if (!Number.isInteger(count) || count <= 0) {
    const err = new Error('expected_train_count must be an integer greater than 0');
    err.statusCode = 400;
    throw err;
  }

  const conf = Number(confidence);
  if (isNaN(conf) || conf < 0 || conf > 1) {
    const err = new Error('confidence must be a number between 0.0 and 1.0');
    err.statusCode = 400;
    throw err;
  }

  const section = await opsRepo.findSectionById(section_id);
  if (!section) {
    const err = new Error(`Railway section with ID "${section_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.insertFreightForecast({
    ...payload,
    expected_train_count: count,
    confidence: conf,
    expected_entry_time: entry.toISOString(),
    expected_exit_time: exit.toISOString()
  });
};

export const getFreightForecasts = async (filters) => {
  return opsRepo.findFreightForecasts(filters);
};

// --- CORRIDOR AVAILABILITY & FREE WINDOW CALCULATION ---

export const createCorridorAvailability = async (payload) => {
  const { section_id, availability_date, start_time, end_time, status, reason, source } = payload;

  if (!section_id) {
    const err = new Error('section_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!availability_date) {
    const err = new Error('availability_date is required');
    err.statusCode = 400;
    throw err;
  }

  if (!start_time || !end_time) {
    const err = new Error('start_time and end_time are required');
    err.statusCode = 400;
    throw err;
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const err = new Error('Invalid start_time or end_time timestamp format');
    err.statusCode = 400;
    throw err;
  }

  if (start >= end) {
    const err = new Error('start_time must be strictly before end_time');
    err.statusCode = 400;
    throw err;
  }

  if (status && !VALID_CORRIDOR_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_CORRIDOR_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const section = await opsRepo.findSectionById(section_id);
  if (!section) {
    const err = new Error(`Railway section with ID "${section_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  return opsRepo.insertCorridorAvailability({
    ...payload,
    start_time: start.toISOString(),
    end_time: end.toISOString()
  });
};

export const calculateCorridorAvailability = async (params) => {
  const { section_id, date, start_time, end_time } = params;

  if (!section_id) {
    const err = new Error('section_id parameter is required');
    err.statusCode = 400;
    throw err;
  }

  const section = await opsRepo.findSectionById(section_id);
  if (!section) {
    const err = new Error(`Railway section with ID "${section_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  // Parse operational time horizon (Indian Standard Time / local date assumption)
  let horizonStart;
  let horizonEnd;

  if (start_time && end_time) {
    horizonStart = new Date(start_time);
    horizonEnd = new Date(end_time);
  } else if (date) {
    horizonStart = new Date(`${date}T00:00:00.000Z`);
    horizonEnd = new Date(`${date}T23:59:59.999Z`);
  } else {
    const err = new Error('Either date (YYYY-MM-DD) or both start_time and end_time must be specified');
    err.statusCode = 400;
    throw err;
  }

  if (isNaN(horizonStart.getTime()) || isNaN(horizonEnd.getTime())) {
    const err = new Error('Invalid date/time horizon format');
    err.statusCode = 400;
    throw err;
  }

  if (horizonStart >= horizonEnd) {
    const err = new Error('Horizon start_time must precede end_time');
    err.statusCode = 400;
    throw err;
  }

  const isoStart = horizonStart.toISOString();
  const isoEnd = horizonEnd.toISOString();

  // 1. Fetch overlapping train movements, freight forecasts, and corridor restrictions
  const [trainMovements, freightForecasts, restrictions] = await Promise.all([
    opsRepo.findMovementsOverlapping(section_id, isoStart, isoEnd),
    opsRepo.findFreightOverlapping(section_id, isoStart, isoEnd),
    opsRepo.findCorridorRestrictionsOverlapping(section_id, isoStart, isoEnd)
  ]);

  // 2. Aggregate all operational blocking spans
  const rawIntervals = [];

  for (const m of trainMovements) {
    const mStart = new Date(Math.max(new Date(m.entry_time).getTime(), horizonStart.getTime()));
    const mEnd = new Date(Math.min(new Date(m.exit_time).getTime(), horizonEnd.getTime()));
    if (mStart < mEnd) {
      rawIntervals.push({ start: mStart, end: mEnd, reason: `Train ${m.train_number} (${m.train_type})` });
    }
  }

  for (const r of restrictions) {
    const rStart = new Date(Math.max(new Date(r.start_time).getTime(), horizonStart.getTime()));
    const rEnd = new Date(Math.min(new Date(r.end_time).getTime(), horizonEnd.getTime()));
    if (rStart < rEnd) {
      rawIntervals.push({ start: rStart, end: rEnd, reason: `Restriction: ${r.reason || r.status}` });
    }
  }

  // 3. Sort intervals chronologically
  rawIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 4. Merge overlapping/contiguous busy spans
  const mergedBusy = [];
  for (const interval of rawIntervals) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ start: interval.start, end: interval.end });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.start.getTime() <= last.end.getTime()) {
        last.end = new Date(Math.max(last.end.getTime(), interval.end.getTime()));
      } else {
        mergedBusy.push({ start: interval.start, end: interval.end });
      }
    }
  }

  // 5. Compute free corridor gaps
  const freeWindows = [];
  let currentPointer = new Date(horizonStart);

  for (const block of mergedBusy) {
    if (block.start.getTime() > currentPointer.getTime()) {
      const durationMin = Math.round((block.start.getTime() - currentPointer.getTime()) / 60000);
      if (durationMin > 0) {
        freeWindows.push({
          start_time: currentPointer.toISOString(),
          end_time: block.start.toISOString(),
          duration_minutes: durationMin
        });
      }
    }
    if (block.end.getTime() > currentPointer.getTime()) {
      currentPointer = new Date(block.end);
    }
  }

  if (currentPointer.getTime() < horizonEnd.getTime()) {
    const durationMin = Math.round((horizonEnd.getTime() - currentPointer.getTime()) / 60000);
    if (durationMin > 0) {
      freeWindows.push({
        start_time: currentPointer.toISOString(),
        end_time: horizonEnd.toISOString(),
        duration_minutes: durationMin
      });
    }
  }

  return {
    section: {
      id: section.id,
      section_code: section.section_code,
      name: section.name,
      length_km: section.length_km,
      track_count: section.track_count,
      electrified: section.electrified
    },
    horizon: {
      start_time: isoStart,
      end_time: isoEnd
    },
    scheduled_train_occupancies: trainMovements.map((tm) => ({
      movement_id: tm.id,
      train_number: tm.train_number,
      train_name: tm.train_name,
      train_type: tm.train_type,
      priority: tm.priority,
      entry_time: tm.entry_time,
      exit_time: tm.exit_time,
      duration_minutes: Math.round((new Date(tm.exit_time) - new Date(tm.entry_time)) / 60000)
    })),
    freight_forecasts: freightForecasts.map((ff) => ({
      forecast_id: ff.id,
      expected_entry_time: ff.expected_entry_time,
      expected_exit_time: ff.expected_exit_time,
      expected_train_count: ff.expected_train_count,
      confidence: Number(ff.confidence),
      source: ff.source
    })),
    corridor_restrictions: restrictions.map((r) => ({
      restriction_id: r.id,
      start_time: r.start_time,
      end_time: r.end_time,
      status: r.status,
      reason: r.reason,
      source: r.source
    })),
    free_windows: freeWindows
  };
};
