/**
 * The edit sheet's rules: what it shows for what the person has typed and tapped so
 * far, and the purchase Save adds. For now the sheet only adds a purchase (HW-12).
 * Opening a purchase to change it comes with HW-13.
 *
 * Nothing here knows any food. A food the household knows brings its usual purchase,
 * the last one entered. The units and their one-tap amounts come from units.ts, and
 * the date estimates from storages.ts.
 */
import type { Batch, HouseholdData, Ingredient } from '@/data/rows';
import { DEFAULT_STORAGE, type StorageId } from '@/data/storages';
import { fromBase, NEW_FOOD_UNITS, type UnitId, unitOf, unitsOfKind } from '@/data/units';

import { nudge } from './amounts';
import { type Day, estimateUseBy } from './dates';
import { cleanName, findIngredient, type Purchase } from './stock';

/** An amount as the person sees it: 1.5 with 'lb'. */
type Amount = { quantity: number; unit: UnitId };

/**
 * What the person has typed and tapped. An amount or a storage that is still null was
 * not touched, so it follows the food: its usual purchase, or the defaults for a new one.
 */
export type Draft = {
  name: string;
  /** Kept with the unit it was set in, since the number means nothing without it. */
  amount: Amount | null;
  storage: StorageId | null;
};

export const EMPTY_DRAFT: Draft = { name: '', amount: null, storage: null };

/** Everything the sheet shows for a draft, and what Save adds. */
export type Sheet = Amount & {
  /** The name as it is saved, without extra spaces. */
  name: string;
  /** The food with that name, when the household already knows it. */
  food: Ingredient | undefined;
  /** The units to choose from. With only one, as for a counted food, there is no unit control. */
  units: UnitId[];
  /** A counted food's own word, such as "block". */
  label: string | null;
  storage: StorageId;
  useBy: Day;
  /** Where the date comes from. The sheet has no date to pick yet (HW-13), so it is always the app's guess. */
  dateSource: Batch['date_source'];
};

/** The units of the food's kind. A new food, or a staple, gets the units for a new food. */
function unitsFor(food: Ingredient | undefined): UnitId[] {
  if (food === undefined || food.tracking === 'level') {
    return [...NEW_FOOD_UNITS];
  }
  return unitsOfKind(food.tracking).map((unit) => unit.id);
}

/**
 * The amount to show: the one the person set, as long as the food takes its unit; else
 * the food's usual purchase; else 1 of the first unit offered.
 */
function amountFor(food: Ingredient | undefined, units: UnitId[], set: Amount | null): Amount {
  if (set && units.includes(set.unit)) {
    return set;
  }
  const usualUnit = food?.usual_unit;
  if (food?.usual_amount && usualUnit && units.includes(usualUnit)) {
    return { quantity: fromBase(food.usual_amount, usualUnit), unit: usualUnit };
  }
  return { quantity: 1, unit: units[0] };
}

/** What the sheet shows for the draft. It works before the household has loaded too: every name is new then. */
export function sheetFor(data: HouseholdData | undefined, draft: Draft, today: Day): Sheet {
  const name = cleanName(draft.name);
  const food = data && name !== '' ? findIngredient(data, name) : undefined;
  const units = unitsFor(food);
  const { quantity, unit } = amountFor(food, units, draft.amount);
  const storage = draft.storage ?? food?.usual_storage ?? DEFAULT_STORAGE;

  return {
    name,
    food,
    units,
    quantity,
    unit,
    // Only a counted food has a word, and a new one has none yet.
    label: unitOf(unit).kind === 'count' ? (food?.usual_label ?? null) : null,
    storage,
    useBy: estimateUseBy(storage, today),
    dateSource: 'estimated',
  };
}

/** One tap on the stepper. Less never makes the amount bigger, even from below one step. */
export function stepped({ quantity, unit }: Amount, direction: 1 | -1): number {
  const next = nudge(quantity, unitOf(unit).step, direction);
  return direction === 1 ? next : Math.min(next, quantity);
}

/** The purchase Save adds, or null while there is no name. */
export function purchaseFrom(sheet: Sheet): Purchase | null {
  if (sheet.name === '') {
    return null;
  }
  return {
    name: sheet.name,
    quantity: sheet.quantity,
    unit: sheet.unit,
    label: sheet.label,
    storage: sheet.storage,
    use_by: sheet.useBy,
    date_source: sheet.dateSource,
    // The optional price comes with HW-13.
    price_cents: null,
  };
}
