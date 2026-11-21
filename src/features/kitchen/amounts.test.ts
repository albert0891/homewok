import { batch } from '@/data/testRows';
import { toBase } from '@/data/units';

import { formatAmount, formatNumber, formatQuantity, formatTotal, nudge } from './amounts';

describe('formatNumber', () => {
  it.each([
    [0.5, '½'],
    [1.5, '1½'],
    [0.25, '¼'],
    [2.75, '2¾'],
    [1 / 3, '⅓'],
    [1 + 2 / 3, '1⅔'],
    [2, '2'],
    [12, '12'],
    [2.3, '2.3'],
    [2.31, '2.3'],
    [0.05, '0.05'],
    [0.999, '1'],
    [1.001, '1'],
  ])('writes %s as %s', (value, text) => {
    expect(formatNumber(value)).toBe(text);
  });
});

describe('formatAmount', () => {
  it('shows weight and volume in the unit the person chose', () => {
    expect(formatAmount(batch({ amount: toBase(1.5, 'lb'), unit: 'lb', label: null }))).toBe('1½ lb');
    expect(formatAmount(batch({ amount: toBase(8, 'oz'), unit: 'oz', label: null }))).toBe('8 oz');
    expect(formatAmount(batch({ amount: toBase(12, 'fl oz'), unit: 'fl oz', label: null }))).toBe('12 fl oz');
    expect(formatAmount(batch({ amount: toBase(0.5, 'gal'), unit: 'gal', label: null }))).toBe('½ gal');
  });

  it('says cup for one and cups for more', () => {
    expect(formatAmount(batch({ amount: toBase(0.5, 'cup'), unit: 'cup', label: null }))).toBe('½ cup');
    expect(formatAmount(batch({ amount: toBase(1, 'cup'), unit: 'cup', label: null }))).toBe('1 cup');
    expect(formatAmount(batch({ amount: toBase(2, 'cup'), unit: 'cup', label: null }))).toBe('2 cups');
  });

  it("uses a counted food's own word, one or many", () => {
    expect(formatAmount(batch({ amount: 1, label: 'block' }))).toBe('1 block');
    expect(formatAmount(batch({ amount: 2, label: 'block' }))).toBe('2 blocks');
    expect(formatAmount(batch({ amount: 0.5, label: 'block' }))).toBe('½ block');
    expect(formatAmount(batch({ amount: 1.5, label: 'block' }))).toBe('1½ blocks');
    expect(formatAmount(batch({ amount: 2, label: 'bunch' }))).toBe('2 bunches');
    expect(formatAmount(batch({ amount: 3, label: 'box' }))).toBe('3 boxes');
  });

  it('leaves a word alone when it is already plural or not English', () => {
    expect(formatAmount(batch({ amount: 2, label: 'blocks' }))).toBe('2 blocks');
    expect(formatAmount(batch({ amount: 2, label: '塊' }))).toBe('2 塊');
  });

  it('shows only the number for a counted food without a word', () => {
    expect(formatAmount(batch({ amount: 10, label: null }))).toBe('10');
  });

  it('marks a guess with ~', () => {
    expect(formatAmount(batch({ amount: 2, label: 'block', is_estimate: true }))).toBe('~2 blocks');
  });
});

describe('formatQuantity', () => {
  it('writes a number in a unit, as the stepper and its chips show it', () => {
    expect(formatQuantity(1.5, 'lb', null)).toBe('1½ lb');
    expect(formatQuantity(2, 'cup', null)).toBe('2 cups');
    expect(formatQuantity(2, 'count', 'block')).toBe('2 blocks');
    expect(formatQuantity(0.5, 'count', 'bunch')).toBe('½ bunch');
    expect(formatQuantity(12, 'count', null)).toBe('12');
  });

  it('keeps a word only for counted foods', () => {
    expect(formatQuantity(1, 'lb', 'block')).toBe('1 lb');
  });
});

describe('formatTotal', () => {
  const halfPound = batch({ amount: toBase(0.5, 'lb'), unit: 'lb', label: null });
  const eightOunces = batch({ amount: toBase(8, 'oz'), unit: 'oz', label: null });
  const onePound = batch({ amount: toBase(1, 'lb'), unit: 'lb', label: null });

  it('is the amount itself for one purchase', () => {
    expect(formatTotal([halfPound])).toBe('½ lb');
  });

  it('adds up purchases of the same kind', () => {
    expect(formatTotal([halfPound, onePound])).toBe('1½ lb');
    expect(formatTotal([batch({ amount: 2 }), batch({ amount: 1 })])).toBe('3 blocks');
  });

  it('uses the larger unit when the purchases use different ones', () => {
    expect(formatTotal([eightOunces, onePound])).toBe('1½ lb');
  });

  it('is a guess when any part of it is a guess', () => {
    expect(formatTotal([halfPound, { ...onePound, is_estimate: true }])).toBe('~1½ lb');
  });

  it('keeps amounts apart when they cannot be added', () => {
    const bunch = batch({ amount: 1, label: 'bunch' });
    const stalks = batch({ amount: 3, label: 'stalk' });

    expect(formatTotal([bunch, stalks])).toBe('1 bunch + 3 stalks');
    expect(formatTotal([bunch, onePound, stalks, halfPound])).toBe('1 bunch + 1½ lb + 3 stalks');
  });

  it('is empty when there is nothing', () => {
    expect(formatTotal([])).toBe('');
  });
});

describe('nudge', () => {
  it.each([
    [1, 0.5, 1, 1.5],
    [1, 0.5, -1, 0.5],
    [8, 2, 1, 10],
    [3, 1, -1, 2],
  ] as const)('moves %s by one step of %s', (quantity, step, direction, expected) => {
    expect(nudge(quantity, step, direction)).toBeCloseTo(expected, 10);
  });

  it('lands on the next multiple of the step from an amount in between', () => {
    expect(nudge(1.3, 0.5, 1)).toBeCloseTo(1.5, 10);
    expect(nudge(1.3, 0.5, -1)).toBeCloseTo(1, 10);
    expect(nudge(7, 2, 1)).toBeCloseTo(8, 10);
  });

  it('never goes below one step', () => {
    expect(nudge(0.5, 0.5, -1)).toBeCloseTo(0.5, 10);
    expect(nudge(0.2, 0.5, -1)).toBeCloseTo(0.5, 10);
    expect(nudge(1, 1, -1)).toBeCloseTo(1, 10);
  });
});
