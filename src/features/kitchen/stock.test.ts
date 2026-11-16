import { applyChanges } from '@/data/changes';
import { batch, household, id, ingredient, staple } from '@/data/testRows';
import { toBase } from '@/data/units';

import {
  addPurchase,
  addStaple,
  editBatch,
  findIngredient,
  type Purchase,
  removeBatch,
  removeFood,
  renameFood,
  setStatus,
  deductFood,
} from './stock';

const newIds = { ingredient: id(900), batch: id(901) };

function purchase(fields: Partial<Purchase> = {}): Purchase {
  return {
    name: 'Ground pork',
    quantity: 1,
    unit: 'lb',
    label: null,
    storage: 'fridge',
    use_by: '2026-11-15',
    date_source: 'use_by',
    price_cents: 499,
    ...fields,
  };
}

describe('findIngredient', () => {
  const data = household({
    ingredients: [ingredient({ id: id(1), name: 'Ground pork' }), ingredient({ id: id(2), name: '豆腐' })],
  });

  it('finds a food whatever the capitals and spaces', () => {
    expect(findIngredient(data, '  ground   PORK ')?.id).toBe(id(1));
    expect(findIngredient(data, '豆腐')?.id).toBe(id(2));
  });

  it('finds nothing for a food the household does not know', () => {
    expect(findIngredient(data, 'Ground beef')).toBeUndefined();
  });
});

describe('addPurchase', () => {
  it('creates the food the first time it is added', () => {
    const changes = addPurchase(household(), purchase({ name: '  Ground  pork ' }), newIds);

    expect(changes).toEqual({
      ingredients: [
        {
          id: newIds.ingredient,
          name: 'Ground pork',
          tracking: 'weight',
          status: null,
          usual_amount: toBase(1, 'lb'),
          usual_unit: 'lb',
          usual_label: null,
          usual_storage: 'fridge',
        },
      ],
      batches: [
        {
          id: newIds.batch,
          ingredient_id: newIds.ingredient,
          amount: toBase(1, 'lb'),
          unit: 'lb',
          label: null,
          is_estimate: false,
          storage: 'fridge',
          use_by: '2026-11-15',
          date_source: 'use_by',
          price_cents: 499,
        },
      ],
    });
  });

  it('adds a second purchase to a food it already knows, and remembers the newest as usual', () => {
    const pork = ingredient({ id: id(1), name: 'Ground pork', tracking: 'weight', usual_amount: 100 });
    const data = household({ ingredients: [pork], batches: [batch({ ingredient_id: pork.id })] });

    const changes = addPurchase(data, purchase({ name: 'ground PORK', quantity: 2, storage: 'freezer' }), newIds);

    expect(changes.ingredients).toEqual([
      { ...pork, usual_amount: toBase(2, 'lb'), usual_unit: 'lb', usual_label: null, usual_storage: 'freezer' },
    ]);
    expect(changes.batches?.[0]).toMatchObject({ id: newIds.batch, ingredient_id: pork.id, storage: 'freezer' });
    expect(applyChanges(data, changes).batches).toHaveLength(2);
  });

  it('keeps the word of a counted food', () => {
    const changes = addPurchase(
      household(),
      purchase({ name: 'Tofu', quantity: 2, unit: 'count', label: ' block ' }),
      newIds,
    );

    expect(changes.ingredients?.[0]).toMatchObject({ tracking: 'count', usual_label: 'block' });
    expect(changes.batches?.[0]).toMatchObject({ amount: 2, unit: 'count', label: 'block' });
  });

  it('treats an empty word as no word', () => {
    const changes = addPurchase(household(), purchase({ unit: 'count', label: '  ' }), newIds);

    expect(changes.batches?.[0]?.label).toBeNull();
  });

  it('turns a staple into a food with an amount when it gets a purchase', () => {
    const rice = staple({ id: id(5), name: 'Rice' });

    const changes = addPurchase(household({ ingredients: [rice] }), purchase({ name: 'rice', quantity: 5 }), newIds);

    expect(changes.ingredients?.[0]).toMatchObject({ id: rice.id, name: 'Rice', tracking: 'weight', status: null });
  });
});

describe('addStaple', () => {
  it('adds a staple that the household has', () => {
    expect(addStaple(household(), ' Fish  sauce ', id(900))).toEqual({
      ingredients: [
        {
          id: id(900),
          name: 'Fish sauce',
          tracking: 'level',
          status: 'have',
          usual_amount: null,
          usual_unit: null,
          usual_label: null,
          usual_storage: null,
        },
      ],
      removeBatches: [],
    });
  });

  it('turns a food with an amount into a staple and drops its purchases', () => {
    const rice = ingredient({ id: id(5), name: 'Rice', tracking: 'weight' });
    const bag = batch({ id: id(105), ingredient_id: rice.id });
    const data = household({ ingredients: [rice], batches: [bag] });

    const changes = addStaple(data, 'rice', id(900));

    expect(changes.ingredients?.[0]).toMatchObject({ id: rice.id, name: 'Rice', tracking: 'level', status: 'have' });
    expect(changes.removeBatches).toEqual([bag.id]);
  });
});

describe('editBatch', () => {
  const tofu = ingredient({ id: id(1) });
  const guess = batch({ id: id(101), ingredient_id: tofu.id, amount: 2, is_estimate: true });
  const data = household({ ingredients: [tofu], batches: [guess] });
  const same = {
    quantity: 2,
    unit: 'count',
    label: 'block',
    storage: 'fridge',
    use_by: guess.use_by,
    date_source: guess.date_source,
    price_cents: null,
  } as const;

  it('saves the new amount, place, date, and price', () => {
    const changes = editBatch(data, guess.id, {
      ...same,
      quantity: 3,
      storage: 'freezer',
      use_by: '2027-02-10',
      date_source: 'estimated',
      price_cents: 250,
    });

    expect(changes.batches).toEqual([
      { ...guess, amount: 3, is_estimate: false, storage: 'freezer', use_by: '2027-02-10', price_cents: 250 },
    ]);
  });

  it('keeps a guessed amount a guess when only something else changes', () => {
    const changes = editBatch(data, guess.id, { ...same, use_by: '2026-11-14', date_source: 'use_by' });

    expect(changes.batches?.[0]).toMatchObject({ amount: 2, is_estimate: true, use_by: '2026-11-14' });
  });

  it('changes nothing for a purchase that is gone', () => {
    expect(editBatch(data, id(999), same)).toEqual({});
  });
});

describe('renameFood', () => {
  const tofu = ingredient({ id: id(1), name: 'Tofuu' });
  const pork = ingredient({ id: id(2), name: 'Ground pork' });
  const data = household({ ingredients: [tofu, pork] });

  it('gives the food its new name', () => {
    expect(renameFood(data, tofu.id, '  Tofu ')).toEqual({ changes: { ingredients: [{ ...tofu, name: 'Tofu' }] } });
  });

  it('lets a food change only its capitals', () => {
    expect(renameFood(data, pork.id, 'Ground Pork')).toEqual({
      changes: { ingredients: [{ ...pork, name: 'Ground Pork' }] },
    });
  });

  it('refuses a name that another food has', () => {
    expect(renameFood(data, tofu.id, 'ground pork')).toEqual({ problem: 'taken' });
  });

  it('refuses an empty name', () => {
    expect(renameFood(data, tofu.id, '   ')).toEqual({ problem: 'empty' });
  });
});

describe('deductFood', () => {
  const pork = ingredient({ id: id(1), name: 'Ground pork', tracking: 'weight' });
  const older = batch({ id: id(101), ingredient_id: pork.id, amount: toBase(1, 'lb'), unit: 'lb', label: null, use_by: '2026-11-14' });
  const newer = batch({ id: id(102), ingredient_id: pork.id, amount: toBase(2, 'lb'), unit: 'lb', label: null, use_by: '2026-11-20' });
  // Listed newest first, to show the order of the rows does not matter.
  const data = household({ ingredients: [pork], batches: [newer, older] });

  const amount = (quantity: number, unit: 'lb' | 'oz' | 'count' = 'lb', label: string | null = null) =>
    ({ how: 'amount', quantity, unit, label }) as const;

  it('takes an amount from the purchase with the soonest date', () => {
    const { changes, usedUp } = deductFood(data, pork.id, amount(0.5));

    expect(changes.batches).toHaveLength(1);
    expect(changes.batches?.[0]).toMatchObject({ id: older.id, is_estimate: false });
    expect(changes.batches?.[0]?.amount).toBeCloseTo(toBase(0.5, 'lb'), 6);
    expect(changes.removeBatches).toEqual([]);
    expect(usedUp).toBe(false);
  });

  it('carries on into the next purchase when the first runs out', () => {
    const { changes, usedUp } = deductFood(data, pork.id, amount(1.5));

    expect(changes.removeBatches).toEqual([older.id]);
    expect(changes.batches).toHaveLength(1);
    expect(changes.batches?.[0]?.id).toBe(newer.id);
    expect(changes.batches?.[0]?.amount).toBeCloseTo(toBase(1.5, 'lb'), 6);
    expect(usedUp).toBe(false);
  });

  it('understands an amount in another unit of the same kind', () => {
    const { changes } = deductFood(data, pork.id, amount(8, 'oz'));

    expect(changes.batches?.[0]).toMatchObject({ id: older.id, unit: 'lb' });
    expect(changes.batches?.[0]?.amount).toBeCloseTo(toBase(0.5, 'lb'), 6);
  });

  it('uses the food up when the amount is all of it or more', () => {
    expect(deductFood(data, pork.id, amount(3))).toEqual({
      changes: { batches: [], removeBatches: [older.id, newer.id] },
      usedUp: true,
    });
    expect(deductFood(data, pork.id, amount(10)).usedUp).toBe(true);
  });

  it('removes every purchase for "all"', () => {
    expect(deductFood(data, pork.id, { how: 'all' })).toEqual({
      changes: { batches: [], removeBatches: [older.id, newer.id] },
      usedUp: true,
    });
  });

  it('takes half of what is left for "some", and marks the rest as a guess', () => {
    const { changes, usedUp } = deductFood(data, pork.id, { how: 'some' });

    // Half of 3 lb is 1½ lb: all of the older purchase and ½ lb of the newer one.
    expect(changes.removeBatches).toEqual([older.id]);
    expect(changes.batches).toHaveLength(1);
    expect(changes.batches?.[0]).toMatchObject({ id: newer.id, is_estimate: true });
    expect(changes.batches?.[0]?.amount).toBeCloseTo(toBase(1.5, 'lb'), 6);
    expect(usedUp).toBe(false);
  });

  it('marks an untouched purchase as a guess too after "some"', () => {
    const twoEqual = household({
      ingredients: [pork],
      batches: [older, { ...newer, amount: older.amount }],
    });

    const { changes } = deductFood(twoEqual, pork.id, { how: 'some' });

    expect(changes.removeBatches).toEqual([older.id]);
    expect(changes.batches).toEqual([{ ...newer, amount: older.amount, is_estimate: true }]);
  });

  it('halves each kind on its own when the purchases cannot be added together', () => {
    const scallion = ingredient({ id: id(2), name: 'Scallions' });
    const bunches = batch({ id: id(111), ingredient_id: scallion.id, amount: 2, label: 'bunch' });
    const stalks = batch({ id: id(112), ingredient_id: scallion.id, amount: 6, label: 'stalk' });
    const mixed = household({ ingredients: [scallion], batches: [bunches, stalks] });

    const { changes } = deductFood(mixed, scallion.id, { how: 'some' });

    expect(changes.batches).toEqual([
      { ...bunches, amount: 1, is_estimate: true },
      { ...stalks, amount: 3, is_estimate: true },
    ]);
  });

  it('only takes an exact amount from purchases with the same kind and word', () => {
    const scallion = ingredient({ id: id(2), name: 'Scallions' });
    const bunches = batch({ id: id(111), ingredient_id: scallion.id, amount: 2, label: 'bunch', use_by: '2026-11-13' });
    const stalks = batch({ id: id(112), ingredient_id: scallion.id, amount: 6, label: 'stalk', use_by: '2026-11-20' });
    const mixed = household({ ingredients: [scallion], batches: [bunches, stalks] });

    const { changes, usedUp } = deductFood(mixed, scallion.id, amount(2, 'count', 'stalk'));

    expect(changes.batches).toEqual([{ ...stalks, amount: 4 }]);
    expect(changes.removeBatches).toEqual([]);
    expect(usedUp).toBe(false);
  });

  it('leaves the other foods alone', () => {
    const tofu = ingredient({ id: id(3), name: 'Tofu' });
    const tofuBatch = batch({ id: id(121), ingredient_id: tofu.id });
    const both = household({ ingredients: [pork, tofu], batches: [older, tofuBatch] });

    const { changes } = deductFood(both, pork.id, { how: 'all' });

    expect(applyChanges(both, changes).batches).toEqual([tofuBatch]);
  });
});

describe('removeBatch', () => {
  const tofu = ingredient({ id: id(1) });
  const first = batch({ id: id(101), ingredient_id: tofu.id });
  const second = batch({ id: id(102), ingredient_id: tofu.id });

  it('removes one purchase and keeps the food', () => {
    const data = household({ ingredients: [tofu], batches: [first, second] });

    expect(removeBatch(data, first.id)).toEqual({ removeBatches: [first.id], removeIngredients: [] });
  });

  it('removes the food with its last purchase, so a food added by mistake is gone', () => {
    const data = household({ ingredients: [tofu], batches: [first] });

    expect(removeBatch(data, first.id)).toEqual({ removeBatches: [first.id], removeIngredients: [tofu.id] });
  });

  it('changes nothing for a purchase that is gone', () => {
    expect(removeBatch(household(), first.id)).toEqual({});
  });
});

describe('removeFood', () => {
  it('removes the food', () => {
    expect(removeFood(id(1))).toEqual({ removeIngredients: [id(1)] });
  });
});

describe('setStatus', () => {
  const soySauce = staple({ id: id(1) });
  const tofu = ingredient({ id: id(2) });
  const data = household({ ingredients: [soySauce, tofu] });

  it('sets a staple to have, low, or out', () => {
    expect(setStatus(data, soySauce.id, 'out')).toEqual({ ingredients: [{ ...soySauce, status: 'out' }] });
  });

  it('changes nothing for a food that is not a staple', () => {
    expect(setStatus(data, tofu.id, 'low')).toEqual({});
  });
});
