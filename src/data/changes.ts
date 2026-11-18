/**
 * Changes: what one action does to the household's rows.
 *
 * Every action in the app (add a food, use some, check off a shopping item) is
 * described the same way: the rows to save and the ids to remove. The app applies
 * that to its own copy right away with applyChanges, and sends the same thing to
 * the database, where apply_changes (in supabase/migrations) does it in one
 * transaction.
 *
 * A change that is still waiting to be sent is kept on the phone, so it is checked
 * with zod like a row when it is read back.
 */
import { z } from 'zod';

import { batchSchema, type HouseholdData, ingredientSchema, shoppingItemSchema } from './rows';

export const changesSchema = z.object({
  /** Rows to save. A row whose id is already there replaces the old one. */
  ingredients: z.array(ingredientSchema).optional(),
  batches: z.array(batchSchema).optional(),
  items: z.array(shoppingItemSchema).optional(),
  /** Ids of rows to remove. Removing a food also removes its purchases. */
  removeIngredients: z.array(z.uuid()).optional(),
  removeBatches: z.array(z.uuid()).optional(),
  removeItems: z.array(z.uuid()).optional(),
});

export type Changes = z.infer<typeof changesSchema>;

/** Puts saved rows into a list: a known id is replaced in its place, a new one goes at the end. */
function save<Row extends { id: string }>(rows: Row[], saved: Row[] = []): Row[] {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const knownIds = new Set(rows.map((row) => row.id));

  return [
    ...rows.map((row) => savedById.get(row.id) ?? row),
    ...saved.filter((row) => !knownIds.has(row.id)),
  ];
}

/**
 * The household's data after the changes. It works like apply_changes in the
 * database: save first, then remove. The data passed in is left as it was.
 */
export function applyChanges(data: HouseholdData, changes: Changes): HouseholdData {
  const goneIngredients = new Set(changes.removeIngredients);
  const goneBatches = new Set(changes.removeBatches);
  const goneItems = new Set(changes.removeItems);

  return {
    ingredients: save(data.ingredients, changes.ingredients).filter(
      (row) => !goneIngredients.has(row.id),
    ),
    // A food's purchases go with it.
    batches: save(data.batches, changes.batches).filter(
      (row) => !goneBatches.has(row.id) && !goneIngredients.has(row.ingredient_id),
    ),
    // A shopping item stays, and only forgets which food it was.
    items: save(data.items, changes.items)
      .filter((row) => !goneItems.has(row.id))
      .map((row) =>
        row.ingredient_id !== null && goneIngredients.has(row.ingredient_id)
          ? { ...row, ingredient_id: null }
          : row,
      ),
  };
}

/** What turns the rows `from` into the rows `to`: the rows to save and the ids to remove. */
function difference<Row extends { id: string }>(from: Row[], to: Row[]) {
  const fromById = new Map(from.map((row) => [row.id, row]));
  const toIds = new Set(to.map((row) => row.id));

  return {
    // applyChanges hands back the very same object for a row it did not touch. So a
    // row that is a different object now, or a new one, was saved.
    save: to.filter((row) => fromById.get(row.id) !== row),
    remove: from.filter((row) => !toIds.has(row.id)).map((row) => row.id),
  };
}

/**
 * The changes that turn `before` into `after`, where `after` was made from `before`
 * with applyChanges, in one step or in several. Each row is in them once, as it
 * ended up, so several of the kitchen's rules can be sent as one action.
 */
export function changesBetween(before: HouseholdData, after: HouseholdData): Required<Changes> {
  const ingredients = difference(before.ingredients, after.ingredients);
  const batches = difference(before.batches, after.batches);
  const items = difference(before.items, after.items);

  return {
    ingredients: ingredients.save,
    batches: batches.save,
    items: items.save,
    removeIngredients: ingredients.remove,
    removeBatches: batches.remove,
    removeItems: items.remove,
  };
}

/**
 * The changes that undo `changes`. `before` is the data as it was before they were
 * applied. This is what Undo sends.
 */
export function undoChanges(before: HouseholdData, changes: Changes): Required<Changes> {
  return changesBetween(applyChanges(before, changes), before);
}

/** The same changes under the parameter names of the database's apply_changes. */
export function toRpcArgs(changes: Changes) {
  return {
    save_ingredients: changes.ingredients ?? [],
    save_batches: changes.batches ?? [],
    save_shopping_items: changes.items ?? [],
    remove_shopping_items: changes.removeItems ?? [],
    remove_batches: changes.removeBatches ?? [],
    remove_ingredients: changes.removeIngredients ?? [],
  };
}
