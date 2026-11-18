/**
 * The sample kitchen: about 20 foods to try the screens with. Only development builds
 * show its button, in the Settings sheet.
 *
 * The foods are data. Each purchase goes in through the same rule as a food added by
 * hand (addPurchase), and each staple through addStaple and setStatus, so the sample
 * can only hold rows the app itself could make. Dates are counted from the day it is
 * loaded, so something is always about to expire.
 */
import { applyChanges, type Changes, changesBetween } from '@/data/changes';
import type { Batch, HouseholdData, StapleStatus } from '@/data/rows';
import type { StorageId } from '@/data/storages';
import type { UnitId } from '@/data/units';
import { addDays, type Day } from '@/features/kitchen/dates';
import {
  addPurchase,
  addStaple,
  findIngredient,
  type Purchase,
  sameName,
  setStatus,
} from '@/features/kitchen/stock';

/** One purchase in the sample. */
type SamplePurchase = {
  name: string;
  /** The number in `unit`, as the add sheet takes it. */
  quantity: number;
  unit: UnitId;
  /** A counted food's word, such as "bunch". */
  label?: string;
  storage: StorageId;
  /** How many days from today its date is: 0 is today, and -1 was yesterday. */
  days: number;
  /** Where the date came from. Left out, it is the app's own guess. */
  date_source?: Batch['date_source'];
};

/**
 * The purchases, a few days of shopping for a family. Some need using within three
 * days, one is past its date, and ground pork was bought twice, so the deduction
 * rule has two purchases to choose from.
 */
export const SAMPLE_PURCHASES: readonly SamplePurchase[] = [
  // Fridge
  { name: 'Scallions', quantity: 1, unit: 'count', label: 'bunch', storage: 'fridge', days: 0 },
  { name: 'Baby bok choy', quantity: 1, unit: 'lb', storage: 'fridge', days: 1 },
  { name: 'Firm tofu', quantity: 2, unit: 'count', label: 'block', storage: 'fridge', days: 2, date_source: 'use_by' },
  { name: 'Ground pork', quantity: 1, unit: 'lb', storage: 'fridge', days: 2, date_source: 'sell_by' },
  { name: 'Shiitake mushrooms', quantity: 8, unit: 'oz', storage: 'fridge', days: 3 },
  { name: 'Chicken thighs', quantity: 2, unit: 'lb', storage: 'fridge', days: -1, date_source: 'use_by' },
  { name: 'Cilantro', quantity: 1, unit: 'count', label: 'bunch', storage: 'fridge', days: 5 },
  { name: 'Napa cabbage', quantity: 1, unit: 'count', label: 'head', storage: 'fridge', days: 6 },
  { name: 'Milk', quantity: 0.5, unit: 'gal', storage: 'fridge', days: 7, date_source: 'sell_by' },
  { name: 'Ginger', quantity: 4, unit: 'oz', storage: 'fridge', days: 14 },
  { name: 'Eggs', quantity: 12, unit: 'count', storage: 'fridge', days: 18, date_source: 'sell_by' },
  // Freezer
  { name: 'Ground pork', quantity: 1, unit: 'lb', storage: 'freezer', days: 85 },
  { name: 'Flank steak', quantity: 1.5, unit: 'lb', storage: 'freezer', days: 60 },
  { name: 'Pork dumplings', quantity: 1, unit: 'count', label: 'bag', storage: 'freezer', days: 120, date_source: 'best_by' },
  { name: 'Shrimp', quantity: 2, unit: 'lb', storage: 'freezer', days: 150, date_source: 'best_by' },
  { name: 'Edamame', quantity: 1, unit: 'count', label: 'bag', storage: 'freezer', days: 200, date_source: 'best_by' },
  // Pantry
  { name: 'Sweet potatoes', quantity: 2, unit: 'lb', storage: 'pantry', days: 14 },
  { name: 'Garlic', quantity: 3, unit: 'count', label: 'head', storage: 'pantry', days: 25 },
  { name: 'Onions', quantity: 3, unit: 'lb', storage: 'pantry', days: 30 },
  { name: 'Rice noodles', quantity: 16, unit: 'oz', storage: 'pantry', days: 240, date_source: 'best_by' },
  { name: 'Coconut milk', quantity: 13.5, unit: 'fl oz', storage: 'pantry', days: 400, date_source: 'best_by' },
];

/** Staples: two of the starter ones run low or out, and two new ones join them. */
export const SAMPLE_STAPLES: readonly { name: string; status: StapleStatus }[] = [
  { name: 'Soy sauce', status: 'low' },
  { name: 'Sesame oil', status: 'out' },
  { name: 'Shaoxing wine', status: 'have' },
  { name: 'Chili crisp', status: 'low' },
];

/** How many different foods the purchases are. A food bought twice counts once. */
export const SAMPLE_FOOD_COUNT = SAMPLE_PURCHASES.filter(
  (sample, index, all) => all.findIndex((other) => sameName(other.name, sample.name)) === index,
).length;

/** A sample purchase as the add sheet would hand it over, with its date counted from today. */
function toPurchase(sample: SamplePurchase, today: Day): Purchase {
  return {
    name: sample.name,
    quantity: sample.quantity,
    unit: sample.unit,
    label: sample.label ?? null,
    storage: sample.storage,
    use_by: addDays(today, sample.days),
    date_source: sample.date_source ?? 'estimated',
    price_cents: null,
  };
}

/**
 * The changes that load the sample kitchen, as one action.
 *
 * Loading it again puts the sample back as it was, with dates from the new day: the
 * purchases of the sample's foods are replaced, so nothing is doubled. Foods that are
 * not in the sample are left alone.
 */
export function loadSampleKitchen(data: HouseholdData, today: Day, newId: () => string): Changes {
  // First, the purchases of foods the sample is about to add, from an earlier sample
  // or not, go.
  const sampleFoodIds = new Set(
    data.ingredients
      .filter((food) => SAMPLE_PURCHASES.some((sample) => sameName(sample.name, food.name)))
      .map((food) => food.id),
  );
  let kitchen = applyChanges(data, {
    removeBatches: data.batches
      .filter((batch) => sampleFoodIds.has(batch.ingredient_id))
      .map((batch) => batch.id),
  });

  // Then each purchase goes in, one after another, so a food bought twice is found the
  // second time and gets both purchases.
  for (const sample of SAMPLE_PURCHASES) {
    const newIds = { ingredient: newId(), batch: newId() };
    kitchen = applyChanges(kitchen, addPurchase(kitchen, toPurchase(sample, today), newIds));
  }

  // Each staple is added the way the app adds one, then set to its level.
  for (const sample of SAMPLE_STAPLES) {
    kitchen = applyChanges(kitchen, addStaple(kitchen, sample.name, newId()));
    const staple = findIngredient(kitchen, sample.name);
    if (staple) {
      kitchen = applyChanges(kitchen, setStatus(kitchen, staple.id, sample.status));
    }
  }

  // One action holds it all: whatever now differs from the household as it was.
  return changesBetween(data, kitchen);
}
