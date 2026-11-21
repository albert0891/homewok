import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fromBase, NEW_FOOD_UNITS, toBase, unitOf, UNITS, unitsOfKind } from './units';

describe('units', () => {
  it('turns what a person types into grams, ml, or pieces', () => {
    expect(toBase(1, 'lb')).toBeCloseTo(453.59, 2);
    expect(toBase(8, 'oz')).toBeCloseTo(226.8, 1);
    expect(toBase(1, 'cup')).toBeCloseTo(236.59, 2);
    expect(toBase(3, 'count')).toBe(3);
  });

  it.each(UNITS.map((unit) => unit.id))('turns %s back into the same number', (unitId) => {
    expect(fromBase(toBase(1.5, unitId), unitId)).toBeCloseTo(1.5, 10);
  });

  it('agrees with the kitchen: 16 oz in a lb, 8 fl oz in a cup, 16 cups in a gal', () => {
    expect(toBase(16, 'oz')).toBeCloseTo(toBase(1, 'lb'), 6);
    expect(toBase(8, 'fl oz')).toBeCloseTo(toBase(1, 'cup'), 6);
    expect(toBase(16, 'cup')).toBeCloseTo(toBase(1, 'gal'), 6);
  });

  it('lists the units of one kind in the order the app offers them', () => {
    expect(unitsOfKind('weight').map((unit) => unit.id)).toEqual(['lb', 'oz']);
    expect(unitsOfKind('volume').map((unit) => unit.id)).toEqual(['fl oz', 'cup', 'gal']);
    expect(unitsOfKind('count').map((unit) => unit.id)).toEqual(['count']);
  });

  it('gives every unit its own id, a size, a stepper step, and a name for the unit control', () => {
    const ids = UNITS.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const unit of UNITS) {
      expect(unitOf(unit.id)).toBe(unit);
      expect(unit.size).toBeGreaterThan(0);
      expect(unit.step).toBeGreaterThan(0);
      expect(unit.chips.length).toBeGreaterThan(0);
      expect(unit.name.trim()).not.toBe('');
    }
  });

  it('offers a food bought for the first time a way to weigh it or count it', () => {
    expect(NEW_FOOD_UNITS).toEqual(['lb', 'oz', 'count']);
    expect(new Set(NEW_FOOD_UNITS.map((id) => unitOf(id).kind))).toEqual(new Set(['weight', 'count']));
  });
});

/**
 * The database refuses a unit it does not know (HW-60), so its list must equal UNITS.
 * This reads the newest migration that sets the unit checks and compares each list
 * with the ids above. A new unit therefore fails here until a migration adds it.
 */
describe('UNITS mirror the unit checks in supabase/migrations', () => {
  const folder = join(__dirname, '../../supabase/migrations');
  const CHECK = /add constraint (\w+)\s+check \((\w+) in \(([^)]*)\)\)/g;

  /** Each unit check in one migration: constraint name to the units it allows. */
  function unitChecks(sql: string): Map<string, string[]> {
    const checks = new Map<string, string[]>();
    for (const [, name, column, list] of sql.matchAll(CHECK)) {
      if (column === 'unit' || column === 'usual_unit') {
        checks.set(
          name,
          list.split(',').map((unit) => unit.trim().replace(/^'|'$/g, '')),
        );
      }
    }
    return checks;
  }

  const newest =
    readdirSync(folder)
      .sort()
      .map((file) => unitChecks(readFileSync(join(folder, file), 'utf8')))
      .filter((checks) => checks.size > 0)
      .pop() ?? new Map<string, string[]>();

  it('checks the unit of every table that keeps one', () => {
    expect([...newest.keys()].sort()).toEqual([
      'batches_unit_known',
      'ingredients_usual_unit_known',
      'shopping_items_unit_known',
    ]);
  });

  it.each([...newest.entries()])('%s allows exactly the units the app knows', (_name, units) => {
    expect([...units].sort()).toEqual(UNITS.map((unit) => unit.id).sort());
  });
});
