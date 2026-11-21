import { applyChanges } from '@/data/changes';
import { household, id, ingredient, staple } from '@/data/testRows';
import { toBase } from '@/data/units';

import { type Draft, EMPTY_DRAFT, purchaseFrom, sheetFor, stepped } from './sheetDraft';
import { addPurchase, type Purchase } from './stock';

// Thursday, November 12, 2026.
const today = '2026-11-12';

function draft(fields: Partial<Draft> = {}): Draft {
  return { ...EMPTY_DRAFT, ...fields };
}

const eggs = ingredient({
  id: id(1),
  name: 'Eggs',
  tracking: 'count',
  usual_amount: 12,
  usual_unit: 'count',
  usual_storage: 'fridge',
});
const tofu = ingredient({
  id: id(2),
  name: 'Firm tofu',
  tracking: 'count',
  usual_amount: 2,
  usual_unit: 'count',
  usual_label: 'block',
  usual_storage: 'fridge',
});
const milk = ingredient({
  id: id(3),
  name: 'Milk',
  tracking: 'volume',
  usual_amount: toBase(0.5, 'gal'),
  usual_unit: 'gal',
  usual_storage: 'fridge',
});
const groundPork = ingredient({
  id: id(4),
  name: 'Ground pork',
  tracking: 'weight',
  usual_amount: toBase(1, 'lb'),
  usual_unit: 'lb',
  usual_storage: 'freezer',
});
const kitchen = household({
  ingredients: [eggs, tofu, milk, groundPork, staple({ id: id(5), name: 'Soy sauce' })],
});

describe('sheetFor', () => {
  it('starts a new food at 1 lb in the fridge, with a week to use it', () => {
    expect(sheetFor(kitchen, draft({ name: ' Pork  belly ' }), today)).toEqual({
      name: 'Pork belly',
      food: undefined,
      units: ['lb', 'oz', 'count'],
      quantity: 1,
      unit: 'lb',
      label: null,
      storage: 'fridge',
      useBy: '2026-11-19',
      dateSource: 'estimated',
    });
  });

  it("fills in a known food's usual purchase, whatever the capitals", () => {
    const sheet = sheetFor(kitchen, draft({ name: 'ground PORK' }), today);

    expect(sheet.food).toBe(groundPork);
    expect(sheet).toMatchObject({ units: ['lb', 'oz'], unit: 'lb', storage: 'freezer' });
    expect(sheet.quantity).toBeCloseTo(1, 10);
  });

  it('shows a counted food as a count, with no unit to choose', () => {
    expect(sheetFor(kitchen, draft({ name: 'Eggs' }), today)).toMatchObject({
      units: ['count'],
      quantity: 12,
      unit: 'count',
      label: null,
    });
  });

  it("keeps a counted food's own word", () => {
    expect(sheetFor(kitchen, draft({ name: 'Firm tofu' }), today)).toMatchObject({
      units: ['count'],
      quantity: 2,
      label: 'block',
    });
  });

  it("offers only the units of the food's kind", () => {
    const sheet = sheetFor(kitchen, draft({ name: 'Milk' }), today);

    expect(sheet).toMatchObject({ units: ['fl oz', 'cup', 'gal'], unit: 'gal', label: null });
    expect(sheet.quantity).toBeCloseTo(0.5, 10);
  });

  it('keeps the amount the person set', () => {
    const sheet = sheetFor(
      kitchen,
      draft({ name: 'Pork belly', amount: { quantity: 8, unit: 'oz' } }),
      today,
    );

    expect(sheet).toMatchObject({ quantity: 8, unit: 'oz' });
  });

  it('drops an amount set in a unit the food does not take', () => {
    // Set while the name was still "Egg", a new food. Eggs are counted.
    const sheet = sheetFor(
      kitchen,
      draft({ name: 'Eggs', amount: { quantity: 2, unit: 'lb' } }),
      today,
    );

    expect(sheet).toMatchObject({ quantity: 12, unit: 'count' });
  });

  it('keeps the storage the person picked, and estimates the date for it', () => {
    expect(sheetFor(kitchen, draft({ name: 'Eggs', storage: 'freezer' }), today)).toMatchObject({
      storage: 'freezer',
      useBy: '2027-02-10',
    });
    expect(
      sheetFor(kitchen, draft({ name: 'Ground pork', storage: 'pantry' }), today),
    ).toMatchObject({ storage: 'pantry', useBy: '2027-05-11' });
  });

  it('offers a staple the units of a new food', () => {
    expect(sheetFor(kitchen, draft({ name: 'Soy sauce' }), today)).toMatchObject({
      units: ['lb', 'oz', 'count'],
      quantity: 1,
      unit: 'lb',
    });
  });

  it('starts at 1 when a known food has no usual purchase yet', () => {
    const garlic = ingredient({ id: id(6), name: 'Garlic', tracking: 'count' });

    expect(
      sheetFor(household({ ingredients: [garlic] }), draft({ name: 'Garlic' }), today),
    ).toMatchObject({ units: ['count'], quantity: 1, unit: 'count', label: null, storage: 'fridge' });
  });

  it('treats every name as new until the household has loaded', () => {
    expect(sheetFor(undefined, draft({ name: 'Eggs' }), today)).toMatchObject({
      food: undefined,
      unit: 'lb',
    });
  });
});

describe('stepped', () => {
  it('moves by one step of the unit', () => {
    expect(stepped({ quantity: 1, unit: 'lb' }, 1)).toBeCloseTo(1.5, 10);
    expect(stepped({ quantity: 1, unit: 'lb' }, -1)).toBeCloseTo(0.5, 10);
    expect(stepped({ quantity: 8, unit: 'oz' }, 1)).toBeCloseTo(10, 10);
    expect(stepped({ quantity: 12, unit: 'count' }, -1)).toBeCloseTo(11, 10);
  });

  it('never makes the amount bigger on Less, even below one step', () => {
    // ½ bunch, from a one-tap amount, is less than one step of 1.
    expect(stepped({ quantity: 0.5, unit: 'count' }, -1)).toBe(0.5);
    expect(stepped({ quantity: 0.5, unit: 'lb' }, -1)).toBe(0.5);
  });
});

describe('purchaseFrom', () => {
  function purchaseFor(name: string): Purchase | null {
    return purchaseFrom(sheetFor(kitchen, draft({ name }), today));
  }

  it('is what Save adds: the cleaned name, the amount, and an estimated date', () => {
    expect(purchaseFor('  Pork   belly ')).toEqual({
      name: 'Pork belly',
      quantity: 1,
      unit: 'lb',
      label: null,
      storage: 'fridge',
      use_by: '2026-11-19',
      date_source: 'estimated',
      price_cents: null,
    });
  });

  it('is nothing while the name is empty', () => {
    expect(purchaseFor('')).toBeNull();
    expect(purchaseFor('   ')).toBeNull();
  });

  it('adds to the food the household knows instead of making a second one', () => {
    const purchase = purchaseFor('eggs');
    if (!purchase) {
      throw new Error('Expected a purchase');
    }
    const after = applyChanges(
      kitchen,
      addPurchase(kitchen, purchase, { ingredient: id(900), batch: id(901) }),
    );

    expect(after.ingredients).toHaveLength(kitchen.ingredients.length);
    expect(after.batches).toEqual([
      expect.objectContaining({ ingredient_id: eggs.id, amount: 12, unit: 'count', storage: 'fridge' }),
    ]);
  });
});
