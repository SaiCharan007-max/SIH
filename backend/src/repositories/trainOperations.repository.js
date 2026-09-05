import { query } from '../config/db.js';

// --- TRAINS ---

export const findStationById = async (id) => {
  const res = await query('SELECT * FROM stations WHERE id = $1', [id]);
  return res.rows[0] || null;
};

export const findSectionById = async (id) => {
  const res = await query('SELECT * FROM railway_sections WHERE id = $1', [id]);
  return res.rows[0] || null;
};

export const findTrainByNumber = async (trainNumber) => {
  const res = await query('SELECT * FROM trains WHERE train_number = $1', [trainNumber]);
  return res.rows[0] || null;
};

export const insertTrain = async (train) => {
  const sql = `
    INSERT INTO trains (
      train_number,
      name,
      train_type,
      priority,
      source_station_id,
      destination_station_id,
      active
    )
    VALUES (
      $1, $2, $3::train_type_enum, COALESCE($4, 'NORMAL')::train_priority_enum, $5, $6, COALESCE($7, true)
    )
    RETURNING *;
  `;
  const values = [
    train.train_number,
    train.name,
    train.train_type,
    train.priority || 'NORMAL',
    train.source_station_id,
    train.destination_station_id,
    train.active ?? true
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

export const findTrains = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.train_type) {
    values.push(filters.train_type);
    conditions.push(`t.train_type = $${values.length}::train_type_enum`);
  }
  if (filters.priority) {
    values.push(filters.priority);
    conditions.push(`t.priority = $${values.length}::train_priority_enum`);
  }
  if (filters.active !== undefined && filters.active !== null) {
    values.push(filters.active === 'true' || filters.active === true);
    conditions.push(`t.active = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      t.*,
      s_src.code AS source_station_code,
      s_src.name AS source_station_name,
      s_dest.code AS destination_station_code,
      s_dest.name AS destination_station_name
    FROM trains t
    JOIN stations s_src ON t.source_station_id = s_src.id
    JOIN stations s_dest ON t.destination_station_id = s_dest.id
    ${whereClause}
    ORDER BY t.priority DESC, t.train_number ASC;
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findTrainById = async (id) => {
  const sql = `
    SELECT 
      t.*,
      s_src.code AS source_station_code,
      s_src.name AS source_station_name,
      s_dest.code AS destination_station_code,
      s_dest.name AS destination_station_name
    FROM trains t
    JOIN stations s_src ON t.source_station_id = s_src.id
    JOIN stations s_dest ON t.destination_station_id = s_dest.id
    WHERE t.id = $1;
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
};

export const updateTrain = async (id, updatePayload) => {
  const allowed = ['name', 'train_type', 'priority', 'active'];
  const setClauses = [];
  const values = [];

  for (const [key, val] of Object.entries(updatePayload)) {
    if (allowed.includes(key)) {
      values.push(val);
      if (key === 'train_type') {
        setClauses.push(`${key} = $${values.length}::train_type_enum`);
      } else if (key === 'priority') {
        setClauses.push(`${key} = $${values.length}::train_priority_enum`);
      } else {
        setClauses.push(`${key} = $${values.length}`);
      }
    }
  }

  if (setClauses.length === 0) {
    return findTrainById(id);
  }

  values.push(id);
  const sql = `
    UPDATE trains
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *;
  `;
  const res = await query(sql, values);
  return res.rows[0] || null;
};

// --- TRAIN ROUTES ---

export const insertTrainRoute = async (route) => {
  const sql = `
    INSERT INTO train_routes (
      train_id,
      route_name,
      service_date,
      active
    )
    VALUES ($1, $2, $3, COALESCE($4, true))
    RETURNING *;
  `;
  const values = [
    route.train_id,
    route.route_name,
    route.service_date,
    route.active ?? true
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

export const findTrainRoutes = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.train_id) {
    values.push(filters.train_id);
    conditions.push(`tr.train_id = $${values.length}`);
  }
  if (filters.service_date) {
    values.push(filters.service_date);
    conditions.push(`tr.service_date = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      tr.*,
      t.train_number,
      t.name AS train_name,
      t.train_type,
      t.priority
    FROM train_routes tr
    JOIN trains t ON tr.train_id = t.id
    ${whereClause}
    ORDER BY tr.service_date DESC, t.train_number ASC;
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findTrainRouteById = async (id) => {
  const sql = `
    SELECT 
      tr.*,
      t.train_number,
      t.name AS train_name,
      t.train_type,
      t.priority
    FROM train_routes tr
    JOIN trains t ON tr.train_id = t.id
    WHERE tr.id = $1;
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
};

// --- TRAIN MOVEMENTS ---

export const insertTrainMovement = async (movement) => {
  const sql = `
    INSERT INTO train_movements (
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
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'SCHEDULED')::movement_status_enum
    )
    RETURNING *;
  `;
  const values = [
    movement.train_route_id,
    movement.section_id,
    movement.sequence_number,
    movement.entry_time,
    movement.exit_time,
    movement.scheduled_entry_time || movement.entry_time,
    movement.scheduled_exit_time || movement.exit_time,
    movement.actual_entry_time || null,
    movement.actual_exit_time || null,
    movement.status || 'SCHEDULED'
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

export const findTrainMovements = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.section_id) {
    values.push(filters.section_id);
    conditions.push(`tm.section_id = $${values.length}`);
  }
  if (filters.train_route_id) {
    values.push(filters.train_route_id);
    conditions.push(`tm.train_route_id = $${values.length}`);
  }
  if (filters.date) {
    values.push(filters.date);
    conditions.push(`(tm.entry_time::date = $${values.length} OR tm.scheduled_entry_time::date = $${values.length})`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`tm.status = $${values.length}::movement_status_enum`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      tm.*,
      sec.section_code,
      sec.name AS section_name,
      tr.route_name,
      tr.service_date,
      t.train_number,
      t.name AS train_name,
      t.train_type,
      t.priority
    FROM train_movements tm
    JOIN railway_sections sec ON tm.section_id = sec.id
    JOIN train_routes tr ON tm.train_route_id = tr.id
    JOIN trains t ON tr.train_id = t.id
    ${whereClause}
    ORDER BY tm.entry_time ASC, tm.sequence_number ASC;
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findTrainMovementById = async (id) => {
  const sql = `
    SELECT 
      tm.*,
      sec.section_code,
      sec.name AS section_name,
      tr.route_name,
      tr.service_date,
      t.train_number,
      t.name AS train_name,
      t.train_type,
      t.priority
    FROM train_movements tm
    JOIN railway_sections sec ON tm.section_id = sec.id
    JOIN train_routes tr ON tm.train_route_id = tr.id
    JOIN trains t ON tr.train_id = t.id
    WHERE tm.id = $1;
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
};

export const findMovementsOverlapping = async (sectionId, startTime, endTime) => {
  const sql = `
    SELECT 
      tm.*,
      sec.section_code,
      sec.name AS section_name,
      tr.route_name,
      t.train_number,
      t.name AS train_name,
      t.train_type,
      t.priority
    FROM train_movements tm
    JOIN railway_sections sec ON tm.section_id = sec.id
    JOIN train_routes tr ON tm.train_route_id = tr.id
    JOIN trains t ON tr.train_id = t.id
    WHERE tm.section_id = $1
      AND tm.status <> 'CANCELLED'
      AND tm.entry_time < $3
      AND tm.exit_time > $2
    ORDER BY tm.entry_time ASC;
  `;
  const res = await query(sql, [sectionId, startTime, endTime]);
  return res.rows;
};

// --- FREIGHT FORECASTS ---

export const insertFreightForecast = async (forecast) => {
  const sql = `
    INSERT INTO freight_forecasts (
      section_id,
      forecast_date,
      expected_entry_time,
      expected_exit_time,
      expected_train_count,
      confidence,
      source
    )
    VALUES (
      $1, $2, $3, $4, COALESCE($5, 1), $6, COALESCE($7, 'CONTROL_OFFICE_FORECAST')
    )
    RETURNING *;
  `;
  const values = [
    forecast.section_id,
    forecast.forecast_date,
    forecast.expected_entry_time,
    forecast.expected_exit_time,
    forecast.expected_train_count ?? 1,
    forecast.confidence,
    forecast.source || 'CONTROL_OFFICE_FORECAST'
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

export const findFreightForecasts = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.section_id) {
    values.push(filters.section_id);
    conditions.push(`ff.section_id = $${values.length}`);
  }
  if (filters.date) {
    values.push(filters.date);
    conditions.push(`ff.forecast_date = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      ff.*,
      sec.section_code,
      sec.name AS section_name
    FROM freight_forecasts ff
    JOIN railway_sections sec ON ff.section_id = sec.id
    ${whereClause}
    ORDER BY ff.expected_entry_time ASC;
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findFreightOverlapping = async (sectionId, startTime, endTime) => {
  const sql = `
    SELECT 
      ff.*,
      sec.section_code,
      sec.name AS section_name
    FROM freight_forecasts ff
    JOIN railway_sections sec ON ff.section_id = sec.id
    WHERE ff.section_id = $1
      AND ff.expected_entry_time < $3
      AND ff.expected_exit_time > $2
    ORDER BY ff.expected_entry_time ASC;
  `;
  const res = await query(sql, [sectionId, startTime, endTime]);
  return res.rows;
};

// --- CORRIDOR AVAILABILITY & RESTRICTIONS ---

export const insertCorridorAvailability = async (corridor) => {
  const sql = `
    INSERT INTO corridor_availability (
      section_id,
      availability_date,
      start_time,
      end_time,
      status,
      reason,
      source
    )
    VALUES (
      $1, $2, $3, $4, COALESCE($5, 'AVAILABLE')::corridor_status_enum, $6, COALESCE($7, 'OPERATIONAL_BASELINE')
    )
    RETURNING *;
  `;
  const values = [
    corridor.section_id,
    corridor.availability_date,
    corridor.start_time,
    corridor.end_time,
    corridor.status || 'AVAILABLE',
    corridor.reason || null,
    corridor.source || 'OPERATIONAL_BASELINE'
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

export const findCorridorAvailability = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.section_id) {
    values.push(filters.section_id);
    conditions.push(`ca.section_id = $${values.length}`);
  }
  if (filters.date) {
    values.push(filters.date);
    conditions.push(`ca.availability_date = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      ca.*,
      sec.section_code,
      sec.name AS section_name
    FROM corridor_availability ca
    JOIN railway_sections sec ON ca.section_id = sec.id
    ${whereClause}
    ORDER BY ca.start_time ASC;
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findCorridorRestrictionsOverlapping = async (sectionId, startTime, endTime) => {
  const sql = `
    SELECT 
      ca.*,
      sec.section_code,
      sec.name AS section_name
    FROM corridor_availability ca
    JOIN railway_sections sec ON ca.section_id = sec.id
    WHERE ca.section_id = $1
      AND ca.status <> 'AVAILABLE'
      AND ca.start_time < $3
      AND ca.end_time > $2
    ORDER BY ca.start_time ASC;
  `;
  const res = await query(sql, [sectionId, startTime, endTime]);
  return res.rows;
};
