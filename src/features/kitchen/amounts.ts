/**
 * How amounts are written and stepped: "1½ lb", "~2 blocks", "1 bunch + 3 stalks".
 *
 * Nothing here knows any food. A label such as "block" is only display text.
 */
import type { Batch } from '@/data/rows';
import { fromBase, type Unit, unitOf } from '@/data/units';

/** Fractions, written the way a recipe card writes them. */
const FRACTIONS = [
  { part: 1 / 4, glyph: '¼' },
  { part: 1 / 3, glyph: '⅓' },
  { part: 1 / 2, glyph: '½' },
  { part: 2 / 3, glyph: '⅔' },
  { part: 3 / 4, glyph: '¾' },
];

/** How far a number may be from a fraction or a whole number and still be written as one. */
const CLOSE_ENOUGH = 0.02;

/** Word endings that take "es" for more than one: bunch, dish, glass, box. */
const ES_ENDINGS = ['ch', 'sh', 'ss', 'x', 'z'];

/** A number the way a recipe card writes it: ½, 1½, 2, 2.3. */
export function formatNumber(value: number): string {
  const whole = Math.floor(value);
  const rest = value - whole;

  if (whole > 0 && rest < CLOSE_ENOUGH) {
    return String(whole);
  }
  if (rest > 1 - CLOSE_ENOUGH) {
    return String(whole + 1);
  }

  const fraction = FRACTIONS.find(({ part }) => Math.abs(rest - part) < CLOSE_ENOUGH);
  if (fraction) {
    return whole === 0 ? fraction.glyph : `${whole}${fraction.glyph}`;
  }

  // Not a kitchen fraction: one decimal place, or two for a very small amount.
  return String(Number(value.toFixed(value < 0.1 ? 2 : 1)));
}

/**
 * A counted food's word for more than one: block, blocks. Only plain English words
 * are changed. A word in another language, or one that already ends in "s", stays
 * as the person typed it.
 */
function plural(word: string): string {
  const lower = word.toLowerCase();

  if (!/^[a-z ]+$/.test(lower) || /[^s]s$/.test(lower)) {
    return word;
  }
  if (ES_ENDINGS.some((ending) => lower.endsWith(ending))) {
    return `${word}es`;
  }
  if (/[^aeiou]y$/.test(lower)) {
    return `${word.slice(0, -1)}ies`;
  }
  return `${word}s`;
}

/** The word after the number: the unit's, or the counted food's own. */
function wordFor(unit: Unit, label: string | null, quantity: number): string {
  const many = quantity > 1 + CLOSE_ENOUGH;

  if (unit.kind === 'count') {
    if (label === null) {
      return '';
    }
    return many ? plural(label) : label;
  }
  return many ? (unit.plural ?? unit.word) : unit.word;
}

type Amount = Pick<Batch, 'amount' | 'unit' | 'label' | 'is_estimate'>;

/** One amount as text: "1½ lb", "2 blocks", "10". A guess starts with "~". */
export function formatAmount({ amount, unit: unitId, label, is_estimate }: Amount): string {
  const quantity = fromBase(amount, unitId);
  const word = wordFor(unitOf(unitId), label, quantity);
  const text = word === '' ? formatNumber(quantity) : `${formatNumber(quantity)} ${word}`;

  return is_estimate ? `~${text}` : text;
}

/**
 * What an amount measures. Two amounts can be added, or one taken from the other,
 * only when this is the same: the same kind and, for counted foods, the same word.
 * So "1 bunch" and "3 stalks" stay apart.
 */
export function measureOf({ unit, label }: Pick<Batch, 'unit' | 'label'>): string {
  const { kind } = unitOf(unit);
  return kind === 'count' ? `count:${(label ?? '').trim().toLowerCase()}` : kind;
}

/** The sum of purchases that measure the same thing, shown in the largest of their units. */
function formatSum(batches: Batch[]): string {
  const largest = batches
    .map((batch) => unitOf(batch.unit))
    .reduce((a, b) => (b.size > a.size ? b : a));

  return formatAmount({
    amount: batches.reduce((sum, batch) => sum + batch.amount, 0),
    unit: largest.id,
    label: batches[0].label,
    is_estimate: batches.some((batch) => batch.is_estimate),
  });
}

/**
 * How much of a food there is across its purchases: "1½ lb". Amounts that cannot be
 * added are listed side by side: "1 bunch + 3 stalks".
 */
export function formatTotal(batches: Batch[]): string {
  const groups = new Map<string, Batch[]>();
  for (const batch of batches) {
    const measure = measureOf(batch);
    groups.set(measure, [...(groups.get(measure) ?? []), batch]);
  }

  return [...groups.values()].map(formatSum).join(' + ');
}

/**
 * The stepper's next value: one step up or down, landing on a multiple of the step,
 * and never below one step.
 */
export function nudge(quantity: number, step: number, direction: 1 | -1): number {
  // A hair of tolerance, so 1.4999999 still counts as 3 whole steps of 0.5.
  const tolerance = 1e-9;
  const steps = quantity / step;
  const next =
    direction === 1 ? Math.floor(steps + tolerance) + 1 : Math.ceil(steps - tolerance) - 1;

  return Math.max(next, 1) * step;
}
