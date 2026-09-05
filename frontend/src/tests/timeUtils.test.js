import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  calculateTimelinePosition,
  intervalsOverlap,
  formatTime
} from '../utils/timeUtils';

describe('timeUtils', () => {
  it('converts time string to total minutes correctly', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('06:00')).toBe(360);
    expect(timeToMinutes('12:30')).toBe(750);
    expect(timeToMinutes('14:45:00')).toBe(885);
    expect(timeToMinutes('22:00')).toBe(1320);
    expect(timeToMinutes(null)).toBe(0);
  });

  it('converts total minutes back to HH:MM format', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(360)).toBe('06:00');
    expect(minutesToTime(750)).toBe('12:30');
    expect(minutesToTime(1320)).toBe('22:00');
  });

  it('formats time to 5 characters', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
    expect(formatTime('09:00')).toBe('09:00');
    expect(formatTime(null)).toBe('--:--');
  });

  it('calculates accurate horizontal timeline position percentages (06:00 -> 22:00)', () => {
    // Total window is 06:00 (360) to 22:00 (1320) = 960 minutes.
    // 06:00 to 08:00 (120 mins) -> left 0%, width 12.5% (120/960)
    const pos1 = calculateTimelinePosition('06:00', '08:00', '06:00', '22:00');
    expect(pos1.leftPct).toBe(0);
    expect(pos1.widthPct).toBe(12.5);

    // 14:00 to 16:00 (120 mins) -> start at 840 (diff 480/960 = 50%) -> left 50%, width 12.5%
    const pos2 = calculateTimelinePosition('14:00', '16:00', '06:00', '22:00');
    expect(pos2.leftPct).toBe(50);
    expect(pos2.widthPct).toBe(12.5);
  });

  it('detects interval overlaps accurately', () => {
    // Overlapping intervals: [100, 200] and [150, 250]
    expect(intervalsOverlap(100, 200, 150, 250)).toBe(true);
    // Non-overlapping intervals: [100, 200] and [200, 300]
    expect(intervalsOverlap(100, 200, 200, 300)).toBe(false);
    // Disjoint intervals: [100, 150] and [200, 250]
    expect(intervalsOverlap(100, 150, 200, 250)).toBe(false);
  });
});
