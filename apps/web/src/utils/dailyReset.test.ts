import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { dailyResetLabel, formatDailyResetTime } from '@/utils/dailyReset';

const NOON_UTC = new Date('2026-06-15T12:00:00Z');

describe('dailyReset', () => {
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
  });

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it.each([
    ['UTC', /^12:00\sAM$/i],
    ['Asia/Kolkata', /^5:30\sAM$/i],
    ['Asia/Kathmandu', /^5:45\sAM$/i],
    ['America/New_York', /^8:00\sPM$/i],
    ['Australia/Adelaide', /^9:30\sAM$/i],
    ['Pacific/Auckland', /^12:00\sPM$/i],
  ])('formats the reset time in %s', (tz, expected) => {
    process.env.TZ = tz;
    expect(formatDailyResetTime(NOON_UTC)).toMatch(expected);
  });

  it('anchors on the UTC day of the given moment', () => {
    process.env.TZ = 'Asia/Kolkata';
    const lateUtc = new Date('2026-06-15T23:59:59Z');
    expect(formatDailyResetTime(lateUtc)).toMatch(/^5:30\sAM$/i);
  });

  it('builds the label sentence', () => {
    process.env.TZ = 'Asia/Kolkata';
    expect(dailyResetLabel(NOON_UTC)).toMatch(/^Resets daily at 5:30\sAM$/i);
  });

  it('defaults to the current time without throwing', () => {
    process.env.TZ = 'UTC';
    expect(formatDailyResetTime()).toMatch(/^12:00\sAM$/i);
    expect(dailyResetLabel()).toMatch(/^Resets daily at 12:00\sAM$/i);
  });
});
