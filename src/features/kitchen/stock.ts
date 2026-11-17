/**
 * The kitchen's rules for stock: adding a purchase, editing one, using some, and
 * removing. Each function takes the household's data and returns Changes (rows to
 * save, ids to remove). None of them saves anything itself, so they are easy to test.
 *
 * New row ids are passed in. The app makes them on the phone, which lets a food that
 * was added offline be edited before it has reached the database.
 */
import type { Changes } from '@/data/changes';
import type { Batch, HouseholdData, Ingredient, StapleStatus } from '@/data/rows';
import type { StorageId } from '@/data/storages';
import { toBase, type UnitId, unitOf } from '@/data/units';

import { measureOf } from './amounts';
import { type Day, soonestFirst } from './dates';

/** Amounts are decimals in grams and ml. Anything smaller than this counts as nothing left. */
const NOTHING_LEFT = 1e-6;

/** A name as it is saved: no spaces at the ends and single spaces inside. Capitals stay as typed. */
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Whether two names mean the same food. Capitals and extra spaces do not count. */
export function sameName(a: string, b: string): boolean {
  return cleanName(a).toLowerCase() === cleanName(b).toLowerCase();
}

/** A counted food's word, or null when there is none. Only counted foods have one. */
export function cleanLabel(unit: UnitId, label: string | null | undefined): string | null {
  const cleaned = label?.trim() ?? '';
  return unitOf(unit).kind === 'count' && cleaned !== '' ? cleaned : null;
}

/** The food with this name, if the household knows it. */
export function findIngredient(data: HouseholdData, name: string): Ingredient | undefined {
  return data.ingredients.find((ingredient) => sameName(ingredient.name, name));
}

/** A food the household has not seen before, with nothing remembered about it yet. */
export function newIngredient(id: string, name: string, tracking: Ingredient['tracking']): Ingredient {
  return {
    id,
    name: cleanName(name),
    tracking,
    status: tracking === 'level' ? 'have' : null,
    usual_amount: null,
    usual_unit: null,
    usual_label: null,
    usual_storage: null,
    usual_spot: null,
  };
}

/** What the add sheet collects for one purchase. */
export type Purchase = {
  name: string;
  /** The number as typed, in `unit`: 1.5 with 'lb'. */
  quantity: number;
  unit: UnitId;
  /** A counted food's word: "block". */
  label: string | null;
  storage: StorageId;
  use_by: Day;
  date_source: Batch['date_source'];
  price_cents: number | null;
};

/** What the edit sheet can change on a purchase. */
export type BatchEdit = Omit<Purchase, 'name'>;

/**
 * Adds a purchase. The food is created the first time its name is used. After that,
 * the same name adds another purchase to the same food.
 */
export function addPurchase(
  data: HouseholdData,
  purchase: Purchase,
  newIds: { ingredient: string; batch: string },
): Changes {
  const { kind } = unitOf(purchase.unit);
  const known = findIngredient(data, purchase.name);
  const amount = toBase(purchase.quantity, purchase.unit);
  const label = cleanLabel(purchase.unit, purchase.label);

  const ingredient: Ingredient = {
    ...(known ?? newIngredient(newIds.ingredient, purchase.name, kind)),
    // The unit says how the food is counted. A staple that gets a purchase is
    // counted from now on.
    tracking: kind,
    status: null,
    // The newest purchase is remembered as the usual one.
    usual_amount: amount,
    usual_unit: purchase.unit,
    usual_label: label,
    usual_storage: purchase.storage,
  };

  const batch: Batch = {
    id: newIds.batch,
    ingredient_id: ingredient.id,
    amount,
    unit: purchase.unit,
    label,
    is_estimate: false,
    storage: purchase.storage,
    // The add sheet does not ask for a spot yet.
    spot: null,
    use_by: purchase.use_by,
    date_source: purchase.date_source,
    price_cents: purchase.price_cents,
  };

  return { ingredients: [ingredient], batches: [batch] };
}

/**
 * Adds a staple, which the household is assumed to have. A staple only has a level
 * (have, low, out), so a counted food that becomes one drops its purchases.
 */
export function addStaple(data: HouseholdData, name: string, newId: string): Changes {
  const known = findIngredient(data, name);
  const ingredient: Ingredient = {
    ...(known ?? newIngredient(newId, name, 'level')),
    tracking: 'level',
    status: 'have',
  };

  return {
    ingredients: [ingredient],
    removeBatches: data.batches
      .filter((batch) => batch.ingredient_id === ingredient.id)
      .map((batch) => batch.id),
  };
}

/** Saves what the edit sheet changed on one purchase. */
export function editBatch(data: HouseholdData, batchId: string, edit: BatchEdit): Changes {
  const batch = data.batches.find((row) => row.id === batchId);
  if (!batch) {
    return {};
  }

  const amount = toBase(edit.quantity, edit.unit);
  const sameAmount = edit.unit === batch.unit && Math.abs(amount - batch.amount) < NOTHING_LEFT;

  return {
    batches: [
      {
        ...batch,
        amount,
        unit: edit.unit,
        label: cleanLabel(edit.unit, edit.label),
        // An amount the person typed is exact. One they left alone stays a guess if it was one.
        is_estimate: sameAmount ? batch.is_estimate : false,
        storage: edit.storage,
        use_by: edit.use_by,
        date_source: edit.date_source,
        price_cents: edit.price_cents,
      },
    ],
  };
}

/** Renames a food, or says why not: the name is empty, or another food has it. */
export function renameFood(
  data: HouseholdData,
  ingredientId: string,
  name: string,
): { changes: Changes } | { problem: 'empty' | 'taken' } {
  const cleaned = cleanName(name);
  if (cleaned === '') {
    return { problem: 'empty' };
  }

  const other = findIngredient(data, cleaned);
  if (other && other.id !== ingredientId) {
    return { problem: 'taken' };
  }

  const ingredient = data.ingredients.find((row) => row.id === ingredientId);
  return { changes: ingredient ? { ingredients: [{ ...ingredient, name: cleaned }] } : {} };
}

/**
 * How much was used. An exact amount comes from the stepper. "Some" and "all" are
 * for when nobody measured.
 */
export type Used =
  | { how: 'amount'; quantity: number; unit: UnitId; label: string | null }
  | { how: 'some' }
  | { how: 'all' };

type Taken = { saved: Batch[]; removed: string[] };

/**
 * Takes an amount out of purchases, in the order given. A purchase with nothing left
 * is removed, and the first one with something left is saved with what remains.
 */
function take(batches: Batch[], amount: number): Taken {
  const taken: Taken = { saved: [], removed: [] };
  let left = amount;

  for (const batch of batches) {
    if (left < NOTHING_LEFT) {
      break;
    }
    if (batch.amount - left < NOTHING_LEFT) {
      taken.removed.push(batch.id);
      left -= batch.amount;
    } else {
      taken.saved.push({ ...batch, amount: batch.amount - left });
      left = 0;
    }
  }
  return taken;
}

/**
 * "Some" takes half of what is left. Nobody measured, so everything that remains is
 * marked as a guess. Purchases that cannot be added together, such as bunches and
 * stalks, are each halved on their own.
 */
function takeHalf(batches: Batch[]): Taken {
  const measures = [...new Set(batches.map(measureOf))];

  const halves = measures.map((measure) => {
    const group = batches.filter((batch) => measureOf(batch) === measure);
    const total = group.reduce((sum, batch) => sum + batch.amount, 0);
    const { saved, removed } = take(group, total / 2);
    const remaining = group
      .filter((batch) => !removed.includes(batch.id))
      .map((batch) => saved.find((row) => row.id === batch.id) ?? batch)
      .map((batch) => ({ ...batch, is_estimate: true }));

    return { saved: remaining, removed };
  });

  return {
    saved: halves.flatMap((half) => half.saved),
    removed: halves.flatMap((half) => half.removed),
  };
}

/** Works out which purchases change and which are used up, for each way of saying how much was used. */
function takeFrom(batches: Batch[], used: Used): Taken {
  if (used.how === 'all') {
    return { saved: [], removed: batches.map((batch) => batch.id) };
  }
  if (used.how === 'some') {
    return takeHalf(batches);
  }

  const measure = measureOf(used);
  return take(
    batches.filter((batch) => measureOf(batch) === measure),
    toBase(used.quantity, used.unit),
  );
}

/**
 * The deduction rule: takes what was used out of a food, from the purchase with the
 * soonest date first. `usedUp` is true when nothing is left, so the screen can offer
 * "Add to list".
 *
 * An exact amount is only taken from purchases that measure the same thing: the
 * same kind and, for counted foods, the same word.
 */
export function deductFood(
  data: HouseholdData,
  ingredientId: string,
  used: Used,
): { changes: Changes; usedUp: boolean } {
  const batches = soonestFirst(data.batches.filter((batch) => batch.ingredient_id === ingredientId));
  const taken = takeFrom(batches, used);

  return {
    changes: { batches: taken.saved, removeBatches: taken.removed },
    usedUp: batches.length > 0 && taken.removed.length === batches.length,
  };
}

/**
 * Removes one purchase. When it was the food's last one, the food goes too, so a
 * food that was added by mistake leaves nothing behind.
 */
export function removeBatch(data: HouseholdData, batchId: string): Changes {
  const batch = data.batches.find((row) => row.id === batchId);
  if (!batch) {
    return {};
  }

  const hasOthers = data.batches.some(
    (row) => row.ingredient_id === batch.ingredient_id && row.id !== batchId,
  );
  return { removeBatches: [batchId], removeIngredients: hasOthers ? [] : [batch.ingredient_id] };
}

/** Removes a food and all its purchases. */
export function removeFood(ingredientId: string): Changes {
  return { removeIngredients: [ingredientId] };
}

/** Sets a staple to have, low, or out. */
export function setStatus(data: HouseholdData, ingredientId: string, status: StapleStatus): Changes {
  const ingredient = data.ingredients.find((row) => row.id === ingredientId);
  if (ingredient?.tracking !== 'level') {
    return {};
  }
  return { ingredients: [{ ...ingredient, status }] };
}
