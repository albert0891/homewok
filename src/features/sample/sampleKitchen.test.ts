import { applyChanges, changesSchema } from '@/data/changes';
import type { HouseholdData } from '@/data/rows';
import { batch, household, id, ingredient, staple } from '@/data/testRows';
import { addDays, daysUntil } from '@/features/kitchen/dates';
import { kitchenSections } from '@/features/kitchen/kitchenList';
import { sameName } from '@/features/kitchen/stock';

import { loadSampleKitchen, SAMPLE_PURCHASES, SAMPLE_STAPLES } from './sampleKitchen';

// Wednesday, November 18, 2026.
const today = '2026-11-18';

/** The staples the database gives every new household (create_household in the migration). */
const STARTER_STAPLES = [
  'Salt',
  'Sugar',
  'Cooking oil',
  'Soy sauce',
  'Rice',
  'Cornstarch',
  'Sesame oil',
  'Rice vinegar',
  'White pepper',
  'Oyster sauce',
];

/** A household as a new account gets it: the starter staples and nothing else. */
const newHousehold = household({
  ingredients: STARTER_STAPLES.map((name, index) => staple({ id: id(index + 1), name })),
});

/** Ids for new rows that are easy to tell apart: from 1001 on, or from wherever a test starts them. */
function idsFrom(start: number): () => string {
  let next = start;
  return () => id((next += 1));
}

function load(data: HouseholdData, day = today, newId = idsFrom(1000)) {
  const changes = loadSampleKitchen(data, day, newId);
  return { changes, after: applyChanges(data, changes) };
}

/** Every row of the Kitchen list, from all its sections. */
function kitchenRows(data: HouseholdData, day = today) {
  return kitchenSections(data, day).flatMap((section) => section.data);
}

/** What the kitchen holds, as lines that can be compared: one per purchase and one per staple. */
function contents(data: HouseholdData): string[] {
  const nameOf = (ingredientId: string) =>
    data.ingredients.find((food) => food.id === ingredientId)?.name;

  return [
    ...data.batches.map(
      (row) => `${nameOf(row.ingredient_id)}: ${row.amount} ${row.unit} in the ${row.storage}, ${row.use_by}`,
    ),
    ...data.ingredients
      .filter((food) => food.tracking === 'level')
      .map((food) => `${food.name}: ${food.status}`),
  ].sort();
}

describe('loadSampleKitchen', () => {
  it('fills a new household with about 20 foods in the fridge, the freezer, and the pantry', () => {
    const { after } = load(newHousehold);

    const foodsWithPurchases = after.ingredients.filter((food) =>
      after.batches.some((row) => row.ingredient_id === food.id),
    );
    expect(foodsWithPurchases.length).toBeGreaterThanOrEqual(18);
    expect(foodsWithPurchases.length).toBeLessThanOrEqual(24);
    expect(kitchenSections(after, today).map((section) => section.title)).toEqual([
      'Fridge',
      'Freezer',
      'Pantry',
      'Staples',
    ]);
  });

  it('has foods to use soon, one past its date, and several frozen ones', () => {
    const { after } = load(newHousehold);

    const rows = kitchenRows(after);
    expect(rows.filter((row) => row.pill !== null).length).toBeGreaterThanOrEqual(3);
    expect(rows.filter((row) => row.warning !== null).length).toBeGreaterThanOrEqual(1);
    const freezer = kitchenSections(after, today).find((section) => section.id === 'freezer');
    expect(freezer?.data.length).toBeGreaterThanOrEqual(3);
  });

  it('has dates read from labels as well as the app’s own guesses', () => {
    const { after } = load(newHousehold);

    const sources = new Set(after.batches.map((row) => row.date_source));
    expect(sources).toContain('estimated');
    expect(sources.size).toBeGreaterThan(1);
  });

  it('adds staples and sets some of them to Low and Out', () => {
    const { after } = load(newHousehold);

    const staples = kitchenSections(after, today).find((section) => section.id === 'staples');
    expect(staples?.data.length).toBeGreaterThan(STARTER_STAPLES.length);
    expect(staples?.data.map((row) => row.amount)).toEqual(
      expect.arrayContaining(['Have', 'Low', 'Out']),
    );
  });

  it('counts every date from the day it is loaded', () => {
    const later = addDays(today, 40);
    const daysLeft = (data: HouseholdData, day: string) =>
      data.batches.map((row) => daysUntil(row.use_by, day)).sort((a, b) => a - b);

    const first = load(newHousehold, today);
    const second = load(newHousehold, later);

    expect(daysLeft(second.after, later)).toEqual(daysLeft(first.after, today));
    // So there is always something about to expire, whatever day it is.
    expect(kitchenRows(second.after, later).some((row) => row.pill !== null)).toBe(true);
  });

  it('gives a food bought more than once one row, with all its purchases', () => {
    const repeated = SAMPLE_PURCHASES.filter(
      (sample, index, all) => all.findIndex((other) => sameName(other.name, sample.name)) !== index,
    );
    // The check "two purchases of ground pork" in HW-15 needs at least one such food.
    expect(repeated.length).toBeGreaterThan(0);

    const { after } = load(newHousehold);

    for (const { name } of repeated) {
      const foods = after.ingredients.filter((food) => sameName(food.name, name));
      const bought = SAMPLE_PURCHASES.filter((sample) => sameName(sample.name, name)).length;
      expect(foods).toHaveLength(1);
      expect(after.batches.filter((row) => row.ingredient_id === foods[0].id)).toHaveLength(bought);
    }
  });

  it('makes rows that pass the row checks, with each row saved once', () => {
    const { changes } = load(newHousehold);

    expect(() => changesSchema.parse(changes)).not.toThrow();
    // The database cannot change one row twice in a call.
    for (const rows of [changes.ingredients ?? [], changes.batches ?? []]) {
      const ids = rows.map((row) => row.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps every starter staple a staple', () => {
    const { after } = load(newHousehold);

    for (const name of STARTER_STAPLES) {
      expect(after.ingredients.find((food) => sameName(food.name, name))?.tracking).toBe('level');
    }
  });

  it('never lists a name as both a purchase and a staple', () => {
    // A staple has no purchases, so the second would undo the first.
    for (const { name } of SAMPLE_STAPLES) {
      expect(SAMPLE_PURCHASES.some((sample) => sameName(sample.name, name))).toBe(false);
    }
  });

  it('puts the sample back as it was when loaded again, without doubling anything', () => {
    const first = load(newHousehold, today, idsFrom(1000));
    const [firstPurchase] = first.after.batches;
    const lowOrOut = SAMPLE_STAPLES.find((sample) => sample.status !== 'have');
    const staple = first.after.ingredients.find((food) => sameName(food.name, lowOrOut?.name ?? ''));
    expect(staple).toBeDefined();
    // Since then, someone used up a food and bought one of the staples.
    const used = applyChanges(first.after, {
      removeBatches: [firstPurchase.id],
      ingredients: staple ? [{ ...staple, status: 'have' }] : [],
    });

    const second = load(used, today, idsFrom(2000));

    expect(contents(second.after)).toEqual(contents(first.after));
    // The same foods: none was made a second time.
    expect(second.after.ingredients.map((food) => food.id).sort()).toEqual(
      first.after.ingredients.map((food) => food.id).sort(),
    );
  });

  it('leaves a food that is not in the sample alone', () => {
    const kimchi = ingredient({ id: id(50), name: 'Kimchi' });
    const jar = batch({ id: id(150), ingredient_id: kimchi.id, label: 'jar' });
    const data = household({ ingredients: [...newHousehold.ingredients, kimchi], batches: [jar] });

    const { changes, after } = load(data);

    expect(after.ingredients).toContain(kimchi);
    expect(after.batches).toContain(jar);
    expect(changes.ingredients?.map((food) => food.id)).not.toContain(kimchi.id);
  });

  it('uses a food the household already has, and gives it the sample purchases instead of its own', () => {
    const { name } = SAMPLE_PURCHASES[0];
    // Typed with other capitals, but the same food.
    const known = ingredient({ id: id(60), name: name.toUpperCase() });
    const old = batch({ id: id(160), ingredient_id: known.id });
    const data = household({ ingredients: [...newHousehold.ingredients, known], batches: [old] });

    const { after } = load(data);

    const foods = after.ingredients.filter((food) => sameName(food.name, name));
    const bought = SAMPLE_PURCHASES.filter((sample) => sameName(sample.name, name)).length;
    expect(foods.map((food) => food.id)).toEqual([known.id]);
    expect(after.batches.map((row) => row.id)).not.toContain(old.id);
    expect(after.batches.filter((row) => row.ingredient_id === known.id)).toHaveLength(bought);
  });
});
