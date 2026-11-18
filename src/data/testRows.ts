/**
 * Small builders for tests: a row with sensible values, where a test only has to
 * name the fields it cares about.
 */
import type { Batch, HouseholdData, Ingredient, ShoppingItem } from './rows';

/** A valid row id that is easy to read in a test: id(7) ends in ...007. */
export function id(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

export function ingredient(fields: Partial<Ingredient> = {}): Ingredient {
  return {
    id: id(1),
    name: 'Tofu',
    tracking: 'count',
    status: null,
    usual_amount: null,
    usual_unit: null,
    usual_label: null,
    usual_storage: null,
    usual_spot: null,
    ...fields,
  };
}

export function staple(fields: Partial<Ingredient> = {}): Ingredient {
  return ingredient({ name: 'Soy sauce', tracking: 'level', status: 'have', ...fields });
}

export function batch(fields: Partial<Batch> = {}): Batch {
  return {
    id: id(101),
    ingredient_id: id(1),
    amount: 2,
    unit: 'count',
    label: 'block',
    is_estimate: false,
    storage: 'fridge',
    spot: null,
    use_by: '2026-11-19',
    date_source: 'estimated',
    price_cents: null,
    ...fields,
  };
}

export function item(fields: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: id(201),
    ingredient_id: null,
    name: 'Milk',
    amount: null,
    unit: null,
    label: null,
    created_at: '2026-11-12T18:00:00.000Z',
    ...fields,
  };
}

export function household(fields: Partial<HouseholdData> = {}): HouseholdData {
  return { ingredients: [], batches: [], items: [], ...fields };
}
