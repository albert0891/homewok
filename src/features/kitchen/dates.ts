/**
 * The date rules: which foods need using soon, how a date is written, and the
 * app's guess at a use-by date. Code decides all of this, never the AI.
 */
import type { Batch } from '@/data/rows';
import { type StorageId, storageOf } from '@/data/storages';

/**
 * A calendar day as the database keeps it: '2026-11-12'. It has no time and no time
 * zone, so a date never slips by a day when the phone travels or the clocks change.
 */
export type Day = string;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A food shows its use-soon pill when it has this many days left, or fewer. */
export const USE_SOON_DAYS = 3;

/** The pill's words for the nearest days. After these it reads "2 days", "3 days". */
const SOON_WORDS = ['Today', 'Tomorrow'];

/** From this many days away, a date is written with its year. */
const FAR_DAYS = 300;

/** The one-tap dates in the edit sheet. */
export const DATE_CHIPS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In a week', days: 7 },
] as const;

/**
 * Days are moved and compared as midnights in UTC, where every day is exactly 24
 * hours. Local midnights are not: a day is 23 or 25 hours long when the clocks change.
 */
function toTime(day: Day): number {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date);
}

function fromTime(time: number): Day {
  return new Date(time).toISOString().slice(0, 10);
}

/** The phone's own calendar day for a moment in time. Pass `new Date()` for today. */
export function toDay(date: Date): Day {
  return fromTime(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function addDays(day: Day, count: number): Day {
  return fromTime(toTime(day) + count * MS_PER_DAY);
}

/** How many days from `today` to `day`. Negative when the day has passed. */
export function daysUntil(day: Day, today: Day): number {
  return Math.round((toTime(day) - toTime(today)) / MS_PER_DAY);
}

/** "Nov 11" */
function monthAndDate(day: Day): string {
  const date = new Date(toTime(day));
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** "Wed, Nov 11" */
export function formatDay(day: Day): string {
  const date = new Date(toTime(day));
  return `${WEEKDAYS[date.getUTCDay()]}, ${monthAndDate(day)}`;
}

/** Rows that have a use-by date, the soonest first. */
export function soonestFirst<Row extends { id: string; use_by: Day }>(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => a.use_by.localeCompare(b.use_by) || a.id.localeCompare(b.id));
}

/**
 * What a row says about a food's date:
 * - 'soon': the use-soon pill, for 3 days or less: "Today", "Tomorrow", "2 days".
 * - 'past': a warning. It never says the food is unsafe, only to check it.
 * - 'later': a quiet line under the name: "Use by Thu, Nov 19".
 */
export type DateNote = { type: 'soon' | 'past' | 'later'; text: string };

function laterText(useBy: Day, isGuess: boolean, days: number): string {
  // A guess always says so, and gives no weekday it cannot stand behind.
  const about = isGuess ? 'about ' : '';

  if (days >= FAR_DAYS) {
    return `Use by ${about}${monthAndDate(useBy)}, ${useBy.slice(0, 4)}`;
  }
  return isGuess ? `Use by about ${monthAndDate(useBy)}` : `Use by ${formatDay(useBy)}`;
}

export function dateNote(useBy: Day, source: Batch['date_source'], today: Day): DateNote {
  const days = daysUntil(useBy, today);

  if (days < 0) {
    return { type: 'past', text: 'Past date, check first' };
  }
  if (days <= USE_SOON_DAYS) {
    return { type: 'soon', text: SOON_WORDS[days] ?? `${days} days` };
  }
  return { type: 'later', text: laterText(useBy, source === 'estimated', days) };
}

/** The app's guess at a use-by date for food that goes into a storage place today. */
export function estimateUseBy(storage: StorageId, today: Day): Day {
  return addDays(today, storageOf(storage).keepsDays);
}
