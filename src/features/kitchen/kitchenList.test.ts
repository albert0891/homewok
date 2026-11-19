import { batch, household, id, ingredient, staple } from '@/data/testRows';
import { toBase } from '@/data/units';

import { type KitchenRow, kitchenSections, rowLabel } from './kitchenList';

// Thursday, November 12, 2026.
const today = '2026-11-12';

const tofu = ingredient({ id: id(1), name: 'Tofu' });
const pork = ingredient({ id: id(2), name: 'Ground pork', tracking: 'weight' });
const milk = ingredient({ id: id(3), name: 'Milk', tracking: 'volume' });
const rice = staple({ id: id(4), name: 'Rice', status: 'low' });
const soySauce = staple({ id: id(5), name: 'Soy sauce' });

const pound = (count: number) => ({ amount: toBase(count, 'lb'), unit: 'lb', label: null }) as const;

describe('kitchenSections', () => {
  it('groups foods by where they are kept, with staples last', () => {
    const data = household({
      ingredients: [tofu, pork, rice],
      batches: [
        batch({ id: id(101), ingredient_id: tofu.id, storage: 'fridge' }),
        batch({ id: id(102), ingredient_id: pork.id, storage: 'freezer', ...pound(1) }),
        batch({ id: id(103), ingredient_id: pork.id, storage: 'pantry', ...pound(1) }),
      ],
    });

    const sections = kitchenSections(data, today);

    expect(sections.map((section) => section.title)).toEqual(['Fridge', 'Freezer', 'Pantry', 'Staples']);
    expect(sections.map((section) => section.data.map((row) => row.name))).toEqual([
      ['Tofu'],
      ['Ground pork'],
      ['Ground pork'],
      ['Rice'],
    ]);
  });

  it('leaves out a place with nothing in it', () => {
    const data = household({ ingredients: [tofu], batches: [batch({ ingredient_id: tofu.id, storage: 'freezer' })] });

    expect(kitchenSections(data, today).map((section) => section.id)).toEqual(['freezer']);
  });

  it('is empty for an empty kitchen', () => {
    expect(kitchenSections(household(), today)).toEqual([]);
  });

  it('shows a food that needs using soon with a pill, and no date line', () => {
    const data = household({
      ingredients: [tofu],
      batches: [batch({ ingredient_id: tofu.id, amount: 2, use_by: '2026-11-13' })],
    });

    expect(kitchenSections(data, today)[0]?.data).toEqual([
      {
        key: `${tofu.id}:fridge`,
        ingredientId: tofu.id,
        name: 'Tofu',
        meta: null,
        pill: 'Tomorrow',
        warning: null,
        amount: '2 blocks',
      },
    ]);
  });

  it('shows a later date under the name, and says when it is a guess', () => {
    const data = household({
      ingredients: [pork],
      batches: [
        batch({ id: id(101), ingredient_id: pork.id, use_by: '2026-11-20', date_source: 'use_by', ...pound(1) }),
        batch({ id: id(102), ingredient_id: pork.id, storage: 'freezer', use_by: '2027-02-10', ...pound(2) }),
      ],
    });

    const [fridge, freezer] = kitchenSections(data, today);

    expect(fridge?.data[0]).toMatchObject({ meta: 'Use by Fri, Nov 20', pill: null, warning: null, amount: '1 lb' });
    expect(freezer?.data[0]).toMatchObject({ meta: 'Use by about Feb 10', amount: '2 lb' });
  });

  it('warns about a food past its date', () => {
    const data = household({
      ingredients: [milk],
      batches: [
        batch({ ingredient_id: milk.id, amount: toBase(0.5, 'gal'), unit: 'gal', label: null, use_by: '2026-11-10' }),
      ],
    });

    expect(kitchenSections(data, today)[0]?.data[0]).toMatchObject({
      meta: null,
      pill: null,
      warning: 'Past date, check first',
      amount: '½ gal',
    });
  });

  it('makes one row of several purchases: the total, the soonest date, and how many', () => {
    const data = household({
      ingredients: [tofu],
      batches: [
        batch({ id: id(101), ingredient_id: tofu.id, amount: 1, use_by: '2026-11-25', date_source: 'use_by' }),
        batch({ id: id(102), ingredient_id: tofu.id, amount: 2, use_by: '2026-11-20', date_source: 'use_by' }),
      ],
    });

    const rows = kitchenSections(data, today)[0]?.data;

    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({ amount: '3 blocks', meta: '2 purchases, use by Fri, Nov 20', pill: null });
  });

  it('keeps the count of purchases when the date moves into the pill', () => {
    const data = household({
      ingredients: [tofu],
      batches: [
        batch({ id: id(101), ingredient_id: tofu.id, use_by: '2026-11-12' }),
        batch({ id: id(102), ingredient_id: tofu.id, use_by: '2026-11-30' }),
      ],
    });

    expect(kitchenSections(data, today)[0]?.data[0]).toMatchObject({ meta: '2 purchases', pill: 'Today' });
  });

  it('lists the food that needs using first at the top, then by name', () => {
    const eggs = ingredient({ id: id(6), name: 'Eggs' });
    const data = household({
      ingredients: [tofu, pork, milk, eggs],
      batches: [
        batch({ id: id(101), ingredient_id: tofu.id, use_by: '2026-11-20' }),
        batch({ id: id(102), ingredient_id: pork.id, use_by: '2026-11-14', ...pound(1) }),
        batch({ id: id(103), ingredient_id: milk.id, use_by: '2026-11-10' }),
        batch({ id: id(104), ingredient_id: eggs.id, use_by: '2026-11-20' }),
      ],
    });

    expect(kitchenSections(data, today)[0]?.data.map((row) => row.name)).toEqual([
      'Milk',
      'Ground pork',
      'Eggs',
      'Tofu',
    ]);
  });

  it('shows staples by name with have, low, or out in place of an amount', () => {
    const data = household({ ingredients: [soySauce, rice, staple({ id: id(7), name: 'Cornstarch', status: 'out' })] });

    expect(kitchenSections(data, today)).toEqual([
      {
        id: 'staples',
        title: 'Staples',
        data: [
          { key: id(7), ingredientId: id(7), name: 'Cornstarch', meta: null, pill: null, warning: null, amount: 'Out' },
          { key: rice.id, ingredientId: rice.id, name: 'Rice', meta: null, pill: null, warning: null, amount: 'Low' },
          { key: soySauce.id, ingredientId: soySauce.id, name: 'Soy sauce', meta: null, pill: null, warning: null, amount: 'Have' },
        ],
      },
    ]);
  });

  it('does not list a food that has nothing left', () => {
    const data = household({ ingredients: [tofu, pork], batches: [batch({ ingredient_id: tofu.id })] });

    expect(kitchenSections(data, today)[0]?.data.map((row) => row.name)).toEqual(['Tofu']);
  });
});

describe('rowLabel', () => {
  const row: KitchenRow = {
    key: 'tofu',
    ingredientId: id(1),
    name: 'Tofu',
    meta: null,
    pill: null,
    warning: null,
    amount: '2 blocks',
  };

  it('reads the name and the amount', () => {
    expect(rowLabel(row)).toBe('Tofu, 2 blocks');
  });

  it('reads the parts in the order they are shown, and says what the pill means', () => {
    expect(rowLabel({ ...row, meta: '2 purchases', pill: 'Tomorrow' })).toBe(
      'Tofu, 2 purchases, use soon: Tomorrow, 2 blocks',
    );
  });

  it('reads the past-date warning as it is written', () => {
    expect(rowLabel({ ...row, warning: 'Past date, check first' })).toBe(
      'Tofu, Past date, check first, 2 blocks',
    );
  });
});
