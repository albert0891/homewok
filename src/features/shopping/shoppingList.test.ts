import { applyChanges, undoChanges } from '@/data/changes';
import { batch, household, id, ingredient, item, staple } from '@/data/testRows';
import { toBase } from '@/data/units';

import { addFoodToList, addItem, buyItem, removeItem, shoppingRows } from './shoppingList';

// Thursday, November 12, 2026.
const today = '2026-11-12';
const now = '2026-11-12T18:00:00.000Z';
const newIds = { ingredient: id(900), batch: id(901) };

describe('addItem', () => {
  it('adds a thing to buy by its name alone', () => {
    expect(addItem(household(), { name: '  Oat   milk ' }, id(900), now)).toEqual({
      changes: {
        items: [
          { id: id(900), ingredient_id: null, name: 'Oat milk', amount: null, unit: null, label: null, created_at: now },
        ],
      },
      already: false,
    });
  });

  it('keeps an amount when the person gives one', () => {
    const { changes } = addItem(household(), { name: 'Ground pork', quantity: 1.5, unit: 'lb' }, id(900), now);

    expect(changes.items?.[0]).toMatchObject({ amount: toBase(1.5, 'lb'), unit: 'lb', label: null });
  });

  it('links the item to a food the household already knows, and uses its name', () => {
    const tofu = ingredient({ id: id(1), name: 'Tofu' });

    const { changes } = addItem(household({ ingredients: [tofu] }), { name: 'tofu' }, id(900), now);

    expect(changes.items?.[0]).toMatchObject({ ingredient_id: tofu.id, name: 'Tofu' });
  });

  it('does not add the same thing twice', () => {
    const data = household({ items: [item({ name: 'Milk' })] });

    expect(addItem(data, { name: ' milk' }, id(900), now)).toEqual({ changes: {}, already: true });
  });

  it('adds nothing for an empty name', () => {
    expect(addItem(household(), { name: '   ' }, id(900), now)).toEqual({ changes: {}, already: false });
  });
});

describe('addFoodToList', () => {
  const tofu = ingredient({ id: id(1), name: 'Tofu' });

  it('puts a food from the kitchen on the list', () => {
    const { changes, already } = addFoodToList(household({ ingredients: [tofu] }), tofu.id, id(900), now);

    expect(changes.items).toEqual([
      { id: id(900), ingredient_id: tofu.id, name: 'Tofu', amount: null, unit: null, label: null, created_at: now },
    ]);
    expect(already).toBe(false);
  });

  it('says so when the food is on the list already', () => {
    const data = household({ ingredients: [tofu], items: [item({ name: 'Bean curd', ingredient_id: tofu.id })] });

    expect(addFoodToList(data, tofu.id, id(900), now)).toEqual({ changes: {}, already: true });
  });
});

describe('removeItem', () => {
  it('takes the item off the list', () => {
    expect(removeItem(id(201))).toEqual({ removeItems: [id(201)] });
  });
});

describe('buyItem', () => {
  it('moves an item with an amount into the kitchen as a new food', () => {
    const pork = item({ id: id(201), name: 'Ground pork', amount: toBase(1, 'lb'), unit: 'lb' });

    const bought = buyItem(household({ items: [pork] }), pork.id, newIds, today);

    expect(bought).toEqual({
      name: 'Ground pork',
      changes: {
        ingredients: [
          {
            id: newIds.ingredient,
            name: 'Ground pork',
            tracking: 'weight',
            status: null,
            usual_amount: toBase(1, 'lb'),
            usual_unit: 'lb',
            usual_label: null,
            usual_storage: null,
            usual_spot: null,
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
            spot: null,
            use_by: '2026-11-19',
            date_source: 'estimated',
            price_cents: null,
          },
        ],
        removeItems: [pork.id],
      },
    });
  });

  it('buys the usual amount, as a guess, when the item has none', () => {
    const tofu = ingredient({
      id: id(1),
      name: 'Tofu',
      usual_amount: 2,
      usual_unit: 'count',
      usual_label: 'block',
      usual_storage: 'freezer',
    });
    const data = household({ ingredients: [tofu], items: [item({ id: id(201), name: 'Tofu', ingredient_id: tofu.id })] });

    const bought = buyItem(data, id(201), newIds, today);

    expect(bought?.changes.ingredients).toEqual([tofu]);
    expect(bought?.changes.batches).toEqual([
      {
        id: newIds.batch,
        ingredient_id: tofu.id,
        amount: 2,
        unit: 'count',
        label: 'block',
        is_estimate: true,
        storage: 'freezer',
        spot: null,
        use_by: '2027-02-10',
        date_source: 'estimated',
        price_cents: null,
      },
    ]);
  });

  it('remembers a new amount as the usual one', () => {
    const tofu = ingredient({ id: id(1), name: 'Tofu', usual_amount: 2, usual_unit: 'count', usual_label: 'block' });
    const three = item({ id: id(201), name: 'Tofu', ingredient_id: tofu.id, amount: 3, unit: 'count', label: 'block' });

    const bought = buyItem(household({ ingredients: [tofu], items: [three] }), three.id, newIds, today);

    expect(bought?.changes.ingredients?.[0]).toMatchObject({ id: tofu.id, usual_amount: 3 });
    expect(bought?.changes.batches?.[0]).toMatchObject({ amount: 3, is_estimate: false });
  });

  it('guesses one of a food it knows nothing about', () => {
    const bought = buyItem(household({ items: [item({ id: id(201), name: 'Daikon' })] }), id(201), newIds, today);

    expect(bought?.changes.ingredients).toEqual([
      {
        id: newIds.ingredient,
        name: 'Daikon',
        tracking: 'count',
        status: null,
        usual_amount: null,
        usual_unit: null,
        usual_label: null,
        usual_storage: null,
        usual_spot: null,
      },
    ]);
    expect(bought?.changes.batches?.[0]).toMatchObject({
      amount: 1,
      unit: 'count',
      label: null,
      is_estimate: true,
      storage: 'fridge',
    });
  });

  it('finds the food by name when the item is not linked to one', () => {
    const tofu = ingredient({ id: id(1), name: 'Tofu' });
    const data = household({ ingredients: [tofu], items: [item({ id: id(201), name: 'TOFU' })] });

    expect(buyItem(data, id(201), newIds, today)?.changes.batches?.[0]?.ingredient_id).toBe(tofu.id);
  });

  it('sets a staple back to have, without a purchase', () => {
    const soySauce = staple({ id: id(5), status: 'out' });
    const data = household({
      ingredients: [soySauce],
      items: [item({ id: id(201), name: 'Soy sauce', ingredient_id: soySauce.id })],
    });

    expect(buyItem(data, id(201), newIds, today)).toEqual({
      name: 'Soy sauce',
      changes: { ingredients: [{ ...soySauce, status: 'have' }], batches: [], removeItems: [id(201)] },
    });
  });

  it('is nothing for an item that is gone', () => {
    expect(buyItem(household(), id(201), newIds, today)).toBeNull();
  });

  it('can be undone: the item is back and the kitchen is as it was', () => {
    const tofu = ingredient({ id: id(1), name: 'Tofu', usual_amount: 2, usual_unit: 'count', usual_label: 'block' });
    const before = household({
      ingredients: [tofu],
      batches: [batch({ id: id(101), ingredient_id: tofu.id })],
      items: [item({ id: id(201), name: 'Tofu', ingredient_id: tofu.id, amount: 3, unit: 'count', label: 'block' })],
    });
    const bought = buyItem(before, id(201), newIds, today);
    const after = applyChanges(before, bought?.changes ?? {});
    expect(after.items).toEqual([]);
    expect(after.batches).toHaveLength(2);

    const undone = applyChanges(after, undoChanges(before, bought?.changes ?? {}));

    expect(undone).toEqual(before);
  });
});

describe('shoppingRows', () => {
  it('lists the items in the order they were added, with their amounts', () => {
    const data = household({
      items: [
        item({ id: id(202), name: 'Tofu', created_at: '2026-11-12T19:00:00.000Z', amount: 2, unit: 'count', label: 'block' }),
        item({ id: id(201), name: 'Milk', created_at: '2026-11-12T18:00:00.000Z' }),
      ],
    });

    expect(shoppingRows(data)).toEqual([
      { id: id(201), name: 'Milk', amount: null },
      { id: id(202), name: 'Tofu', amount: '2 blocks' },
    ]);
  });
});
