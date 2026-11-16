import { applyChanges, type Changes, toRpcArgs, undoChanges } from './changes';
import type { HouseholdData } from './rows';
import { batch, household, id, ingredient, item } from './testRows';

const tofu = ingredient({ id: id(1), name: 'Tofu' });
const pork = ingredient({ id: id(2), name: 'Ground pork', tracking: 'weight' });
const tofuBatch = batch({ id: id(101), ingredient_id: tofu.id });
const porkBatch = batch({ id: id(102), ingredient_id: pork.id, amount: 453.6, unit: 'lb', label: null });
const milk = item({ id: id(201), name: 'Milk' });
const tofuItem = item({ id: id(202), name: 'Tofu', ingredient_id: tofu.id });

const before = household({
  ingredients: [tofu, pork],
  batches: [tofuBatch, porkBatch],
  items: [milk, tofuItem],
});

describe('applyChanges', () => {
  it('adds rows that have new ids', () => {
    const eggs = ingredient({ id: id(3), name: 'Eggs' });
    const eggBatch = batch({ id: id(103), ingredient_id: eggs.id, amount: 12, label: null });

    const after = applyChanges(before, { ingredients: [eggs], batches: [eggBatch] });

    expect(after.ingredients).toEqual([tofu, pork, eggs]);
    expect(after.batches).toEqual([tofuBatch, porkBatch, eggBatch]);
    expect(after.items).toEqual(before.items);
  });

  it('replaces a row that has the same id, keeping its place', () => {
    const lessTofu = { ...tofuBatch, amount: 1 };

    const after = applyChanges(before, { batches: [lessTofu] });

    expect(after.batches).toEqual([lessTofu, porkBatch]);
  });

  it('removes rows by id', () => {
    const after = applyChanges(before, { removeBatches: [tofuBatch.id], removeItems: [milk.id] });

    expect(after.batches).toEqual([porkBatch]);
    expect(after.items).toEqual([tofuItem]);
  });

  it('removes a food with its purchases, and its shopping item forgets the food', () => {
    const after = applyChanges(before, { removeIngredients: [tofu.id] });

    expect(after.ingredients).toEqual([pork]);
    expect(after.batches).toEqual([porkBatch]);
    expect(after.items).toEqual([milk, { ...tofuItem, ingredient_id: null }]);
  });

  it('saves first and removes second, like the database', () => {
    const after = applyChanges(before, {
      batches: [{ ...tofuBatch, amount: 5 }],
      removeBatches: [tofuBatch.id],
    });

    expect(after.batches).toEqual([porkBatch]);
  });

  it('returns new data and leaves the old data as it was', () => {
    const copy = structuredClone(before);

    const after = applyChanges(before, { removeIngredients: [tofu.id], items: [{ ...milk, name: 'Oat milk' }] });

    expect(after).not.toBe(before);
    expect(before).toEqual(copy);
  });

  it('changes nothing when there are no changes', () => {
    expect(applyChanges(before, {})).toEqual(before);
  });
});

/** The same data with every list in id order, so two results can be compared. */
function sorted(data: HouseholdData): HouseholdData {
  const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
  return {
    ingredients: [...data.ingredients].sort(byId),
    batches: [...data.batches].sort(byId),
    items: [...data.items].sort(byId),
  };
}

describe('undoChanges', () => {
  const eggs = ingredient({ id: id(3), name: 'Eggs' });
  const eggBatch = batch({ id: id(103), ingredient_id: eggs.id, amount: 12, label: null });

  const cases: [string, Changes][] = [
    ['adding a food with its first purchase', { ingredients: [eggs], batches: [eggBatch] }],
    ['changing an amount', { batches: [{ ...tofuBatch, amount: 1, is_estimate: true }] }],
    ['removing a purchase', { removeBatches: [porkBatch.id] }],
    ['removing a food that has purchases and a shopping item', { removeIngredients: [tofu.id] }],
    [
      'checking off a shopping item',
      {
        ingredients: [{ ...tofu, usual_amount: 2 }],
        batches: [batch({ id: id(104), ingredient_id: tofu.id })],
        removeItems: [tofuItem.id],
      },
    ],
    ['nothing at all', {}],
  ];

  it.each(cases)('takes the data back to where it was after %s', (_name, changes) => {
    const after = applyChanges(before, changes);

    const undone = applyChanges(after, undoChanges(before, changes));

    expect(sorted(undone)).toEqual(sorted(before));
  });

  it('only touches the rows the changes touched', () => {
    const undo = undoChanges(before, { batches: [{ ...tofuBatch, amount: 1 }] });

    expect(undo).toEqual({
      ingredients: [],
      batches: [tofuBatch],
      items: [],
      removeIngredients: [],
      removeBatches: [],
      removeItems: [],
    });
  });

  it('removes the rows the changes added', () => {
    const undo = undoChanges(before, { ingredients: [eggs], batches: [eggBatch] });

    expect(undo.removeIngredients).toEqual([eggs.id]);
    expect(undo.removeBatches).toEqual([eggBatch.id]);
  });
});

describe('toRpcArgs', () => {
  it('names each list the way apply_changes expects', () => {
    const args = toRpcArgs({ batches: [tofuBatch], removeItems: [milk.id] });

    expect(args).toEqual({
      save_ingredients: [],
      save_batches: [tofuBatch],
      save_shopping_items: [],
      remove_shopping_items: [milk.id],
      remove_batches: [],
      remove_ingredients: [],
    });
  });
});
