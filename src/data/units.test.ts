import { fromBase, toBase, unitOf, UNITS, unitsOfKind } from './units';

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

  it('gives every unit its own id, a size, and a stepper step', () => {
    const ids = UNITS.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const unit of UNITS) {
      expect(unitOf(unit.id)).toBe(unit);
      expect(unit.size).toBeGreaterThan(0);
      expect(unit.step).toBeGreaterThan(0);
      expect(unit.chips.length).toBeGreaterThan(0);
    }
  });
});
