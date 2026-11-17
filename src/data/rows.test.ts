import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { toRpcArgs } from './changes';
import { batchSchema, householdDataSchema, ingredientSchema, shoppingItemSchema } from './rows';
import { batch, ingredient, item, staple } from './testRows';

describe('row checks', () => {
  it('accepts the rows the app writes', () => {
    expect(ingredientSchema.parse(ingredient())).toEqual(ingredient());
    expect(ingredientSchema.parse(staple())).toEqual(staple());
    expect(batchSchema.parse(batch())).toEqual(batch());
    expect(shoppingItemSchema.parse(item())).toEqual(item());
  });

  it('accepts a time the way the database writes it', () => {
    const fromDatabase = item({ created_at: '2026-11-12T18:00:00.123456+00:00' });
    expect(shoppingItemSchema.safeParse(fromDatabase).success).toBe(true);
  });

  it('keeps a spot of up to 30 characters', () => {
    const drawer = batch({ spot: 'Drawer 2' });
    const longest = batch({ spot: 'x'.repeat(30) });
    const food = ingredient({ usual_spot: 'Garage freezer' });

    expect(batchSchema.parse(drawer)).toEqual(drawer);
    expect(batchSchema.parse(longest)).toEqual(longest);
    expect(ingredientSchema.parse(food)).toEqual(food);
  });

  it('drops columns the app does not use', () => {
    const row = { ...batch(), household_id: 'anything', created_at: 'anything' };
    expect(batchSchema.parse(row)).toEqual(batch());
  });

  it.each([
    ['a unit the app does not know', batch({ unit: 'kg' as never })],
    ['an amount of zero', batch({ amount: 0 })],
    ['a storage place the app does not know', batch({ storage: 'cellar' as never })],
    ['a date that is not a calendar day', batch({ use_by: '2026-11-12T00:00:00Z' })],
    ['a price with cents after the decimal point', batch({ price_cents: 2.5 })],
    ['an id that is not an id', batch({ id: 'tofu' })],
    ['an empty spot', batch({ spot: '' })],
    ['a spot longer than 30 characters', batch({ spot: 'x'.repeat(31) })],
  ])('refuses a purchase with %s', (_problem, row) => {
    expect(batchSchema.safeParse(row).success).toBe(false);
  });

  it('refuses a food without a name, or with a kind the app does not know', () => {
    expect(ingredientSchema.safeParse(ingredient({ name: '' })).success).toBe(false);
    expect(ingredientSchema.safeParse(ingredient({ tracking: 'length' as never })).success).toBe(false);
  });

  it('refuses a food whose usual spot is empty or longer than 30 characters', () => {
    expect(ingredientSchema.safeParse(ingredient({ usual_spot: '' })).success).toBe(false);
    expect(ingredientSchema.safeParse(ingredient({ usual_spot: 'x'.repeat(31) })).success).toBe(false);
  });

  it('refuses the whole household when one row is wrong', () => {
    const data = { ingredients: [ingredient()], batches: [batch({ amount: -1 })], items: [] };
    expect(householdDataSchema.safeParse(data).success).toBe(false);
  });
});

/**
 * The app and the database must agree on the columns. This reads the newest
 * definition of apply_changes from supabase/migrations and compares the columns it
 * saves with the fields of the row checks.
 */
describe('rows mirror apply_changes in supabase/migrations', () => {
  const folder = join(__dirname, '../../supabase/migrations');
  const definitions = readdirSync(folder)
    .sort()
    .map((file) => readFileSync(join(folder, file), 'utf8'))
    .filter((sql) => sql.includes('function public.apply_changes('));
  const sql = definitions[definitions.length - 1] ?? '';

  /** The columns between "jsonb_to_recordset(<parameter>) as new_row (" and the closing ")". */
  function columnsSavedFrom(parameter: string): string[] {
    const list = sql.split(`jsonb_to_recordset(${parameter}) as new_row (`)[1]?.split(')')[0] ?? '';
    return list
      .split(',')
      .map((column) => column.trim().split(/\s+/)[0])
      .filter((column) => column !== '');
  }

  it.each([
    ['save_ingredients', ingredientSchema],
    ['save_batches', batchSchema],
    ['save_shopping_items', shoppingItemSchema],
  ] as const)('%s saves exactly the fields of its row check', (parameter, schema) => {
    expect(columnsSavedFrom(parameter).sort()).toEqual(Object.keys(schema.shape).sort());
  });

  it('is called with the parameter names the function declares', () => {
    const declared = sql.split('function public.apply_changes(')[1]?.split(')\nreturns')[0] ?? '';
    const names = declared
      .split('\n')
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((name) => name !== '');

    expect(Object.keys(toRpcArgs({})).sort()).toEqual(names.sort());
  });
});
