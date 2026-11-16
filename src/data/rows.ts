/**
 * The rows the app keeps in the database, and the checks every row must pass.
 *
 * Rows come from outside the app: from Supabase, and from the copy saved on the
 * phone. Each one is checked with zod before it is used, so a row in an unexpected
 * shape is a clear failure and never a wrong amount on screen.
 *
 * The fields have the same names as the columns in supabase/migrations, and
 * rows.test.ts fails when the two drift apart.
 */
import { z } from 'zod';

import { STORAGES } from './storages';
import { UNITS } from './units';

const storageId = z.enum(STORAGES.map((storage) => storage.id));
const unitId = z.enum(UNITS.map((unit) => unit.id));

/** A food the household knows, whether or not any is in the kitchen now. */
export const ingredientSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  /** How the food is counted. 'level' is a staple, which only has a status. */
  tracking: z.enum(['weight', 'volume', 'count', 'level']),
  /** Staples only. */
  status: z.enum(['have', 'low', 'out']).nullable(),
  /** What a usual purchase looks like, for when the food is bought without an amount. */
  usual_amount: z.number().positive().nullable(),
  usual_unit: unitId.nullable(),
  usual_label: z.string().nullable(),
  usual_storage: storageId.nullable(),
});

/** One purchase that still has something left. */
export const batchSchema = z.object({
  id: z.uuid(),
  ingredient_id: z.uuid(),
  /** What is left, in grams, ml, or pieces. */
  amount: z.number().positive(),
  /** The unit the amount is shown in. */
  unit: unitId,
  /** The word for a counted food: "block", "bunch". */
  label: z.string().nullable(),
  /** True when the amount is a guess, shown with "~". */
  is_estimate: z.boolean(),
  storage: storageId,
  /** A calendar day, such as '2026-11-19'. */
  use_by: z.iso.date(),
  /** 'estimated' is the app's own guess, shown as "about". */
  date_source: z.enum(['estimated', 'use_by', 'sell_by', 'best_by']),
  price_cents: z.number().int().nonnegative().nullable(),
});

/** One thing still to buy. */
export const shoppingItemSchema = z.object({
  id: z.uuid(),
  /** The food this is, when the household already knows it. */
  ingredient_id: z.uuid().nullable(),
  name: z.string().min(1),
  amount: z.number().positive().nullable(),
  unit: unitId.nullable(),
  label: z.string().nullable(),
  /** When it was added. The list is shown in this order. */
  created_at: z.iso.datetime({ offset: true }),
});

/** Everything the app keeps for one household. */
export const householdDataSchema = z.object({
  ingredients: z.array(ingredientSchema),
  batches: z.array(batchSchema),
  items: z.array(shoppingItemSchema),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Batch = z.infer<typeof batchSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type HouseholdData = z.infer<typeof householdDataSchema>;

export type StapleStatus = NonNullable<Ingredient['status']>;
