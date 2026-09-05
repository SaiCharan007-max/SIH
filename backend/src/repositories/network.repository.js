import { query } from '../config/db.js';

/**
 * Retrieves all stations sorted by station code.
 */
export const findAllStations = async () => {
  const sql = `
    SELECT id, code, name, latitude, longitude, created_at, updated_at
    FROM stations
    ORDER BY code ASC
  `;
  const res = await query(sql);
  return res.rows;
};

/**
 * Retrieves all railway sections along with from/to station codes and names.
 */
export const findAllSectionsWithStations = async () => {
  const sql = `
    SELECT 
      s.id,
      s.section_code,
      s.name,
      s.from_station_id,
      s.to_station_id,
      st_from.code AS from_station_code,
      st_from.name AS from_station_name,
      st_to.code AS to_station_code,
      st_to.name AS to_station_name,
      s.length_km,
      s.track_count,
      s.electrified,
      s.created_at,
      s.updated_at
    FROM railway_sections s
    JOIN stations st_from ON s.from_station_id = st_from.id
    JOIN stations st_to ON s.to_station_id = st_to.id
    ORDER BY s.section_code ASC
  `;
  const res = await query(sql);
  return res.rows;
};

/**
 * Retrieves all infrastructure assets with section metadata.
 */
export const findAllAssetsWithSection = async () => {
  const sql = `
    SELECT 
      a.id,
      a.asset_code,
      a.asset_type,
      a.name AS asset_name,
      a.name,
      a.department,
      a.section_id,
      s.section_code,
      s.name AS section_name,
      a.criticality,
      a.status,
      a.created_at,
      a.updated_at
    FROM assets a
    JOIN railway_sections s ON a.section_id = s.id
    ORDER BY a.asset_code ASC
  `;
  const res = await query(sql);
  return res.rows;
};
