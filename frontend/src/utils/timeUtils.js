/**
 * Converts a "HH:MM" or "HH:MM:SS" string to total minutes from 00:00.
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.toString().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

/**
 * Converts total minutes from 00:00 to "HH:MM" string.
 */
export const minutesToTime = (totalMinutes) => {
  const normalized = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formats time string to 5-character "HH:MM".
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  return timeStr.toString().slice(0, 5);
};

/**
 * Calculates left percentage and width percentage on a horizontal timeline axis.
 *
 * @param {string} startStr - start time "HH:MM"
 * @param {string} endStr - end time "HH:MM"
 * @param {string} windowStart - timeline start, defaults to '06:00' (360 min)
 * @param {string} windowEnd - timeline end, defaults to '22:00' (1320 min)
 * @returns {{ leftPct: number, widthPct: number }}
 */
export const calculateTimelinePosition = (
  startStr,
  endStr,
  windowStart = '06:00',
  windowEnd = '22:00'
) => {
  const winStartMin = timeToMinutes(windowStart);
  const winEndMin = timeToMinutes(windowEnd);
  const totalWindowMinutes = Math.max(1, winEndMin - winStartMin);

  const startMin = Math.max(winStartMin, timeToMinutes(startStr));
  const endMin = Math.min(winEndMin, timeToMinutes(endStr));

  const clampedStart = Math.max(winStartMin, Math.min(winEndMin, startMin));
  const clampedEnd = Math.max(clampedStart, Math.min(winEndMin, endMin));

  const leftPct = ((clampedStart - winStartMin) / totalWindowMinutes) * 100;
  const widthPct = Math.max(0.4, ((clampedEnd - clampedStart) / totalWindowMinutes) * 100);

  return {
    leftPct: Math.round(leftPct * 100) / 100,
    widthPct: Math.round(widthPct * 100) / 100
  };
};

/**
 * Checks if two open intervals [s1, e1] and [s2, e2] in minutes overlap.
 */
export const intervalsOverlap = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;
