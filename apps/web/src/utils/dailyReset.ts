import { DAILY_RESET_UTC_HOUR } from '@visual-ai/shared';

const RESET_TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

/** The reset moment (UTC hour from shared) on the UTC day of `now`, as a Date. */
function resetMoment(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RESET_UTC_HOUR),
  );
}

/** Daily reset time in the browser's local time zone, e.g. "5:30 AM". */
export function formatDailyResetTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, RESET_TIME_FORMAT).format(resetMoment(now));
}

/** Sentence for credit copy, e.g. "Resets daily at 5:30 AM". */
export function dailyResetLabel(now: Date = new Date()): string {
  return `Resets daily at ${formatDailyResetTime(now)}`;
}
