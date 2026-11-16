/**
 * The units the app knows, as one list of data.
 *
 * The database keeps every amount in a base unit: grams for weight, ml for volume,
 * and a plain number for counted foods. A unit here only says how an amount is typed
 * and shown, so adding one (grams, say) is a new line in this list and nothing else.
 */

/** What an amount measures. Code never needs to know more about a food than this. */
export type Kind = 'weight' | 'volume' | 'count';

type UnitShape = {
  /** Saved with each purchase, so it must never change. */
  id: string;
  kind: Kind;
  /** How many grams, ml, or pieces one of this unit is. */
  size: number;
  /** The word after the number. Counted foods use their own word, such as "block". */
  word: string;
  /** The word for more than one, when it differs: "2 cups". */
  plural?: string;
  /** How much one tap on the stepper adds or takes away. */
  step: number;
  /** One-tap amounts offered under the stepper. */
  chips: readonly number[];
};

export const UNITS = [
  { id: 'lb', kind: 'weight', size: 453.59237, word: 'lb', step: 0.5, chips: [0.5, 1, 2] },
  { id: 'oz', kind: 'weight', size: 28.349523125, word: 'oz', step: 2, chips: [4, 8, 12] },
  { id: 'fl oz', kind: 'volume', size: 29.5735295625, word: 'fl oz', step: 4, chips: [8, 16, 32] },
  { id: 'cup', kind: 'volume', size: 236.5882365, word: 'cup', plural: 'cups', step: 0.5, chips: [0.5, 1, 2] },
  { id: 'gal', kind: 'volume', size: 3785.411784, word: 'gal', step: 0.5, chips: [0.5, 1, 2] },
  { id: 'count', kind: 'count', size: 1, word: '', step: 1, chips: [0.5, 1, 2] },
] as const satisfies readonly UnitShape[];

export type UnitId = (typeof UNITS)[number]['id'];

export type Unit = UnitShape & { id: UnitId };

const BY_ID = new Map<string, Unit>(UNITS.map((unit) => [unit.id, unit]));

export function unitOf(id: UnitId): Unit {
  const unit = BY_ID.get(id);
  if (!unit) {
    // The types rule this out. If it happens anyway, fail loudly, not with a wrong amount.
    throw new Error(`Unknown unit: ${id}`);
  }
  return unit;
}

/** The units offered for one kind of food, in the order of the list above. */
export function unitsOfKind(kind: Kind): Unit[] {
  return UNITS.filter((unit) => unit.kind === kind);
}

/** From what a person types (1.5 lb) to what the database keeps (680.4 grams). */
export function toBase(quantity: number, unitId: UnitId): number {
  return quantity * unitOf(unitId).size;
}

/** From what the database keeps back to a number in the given unit. */
export function fromBase(amount: number, unitId: UnitId): number {
  return amount / unitOf(unitId).size;
}
