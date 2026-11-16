/**
 * The places food is kept, in the order the Kitchen lists them.
 *
 * `keepsDays` is the app's first guess at a use-by date: a week in the fridge, about
 * three months in the freezer, and about six months in the pantry. A guess is always
 * shown as a guess, and the person can change the date.
 */
export const STORAGES = [
  { id: 'fridge', label: 'Fridge', keepsDays: 7 },
  { id: 'freezer', label: 'Freezer', keepsDays: 90 },
  { id: 'pantry', label: 'Pantry', keepsDays: 180 },
] as const;

export type Storage = (typeof STORAGES)[number];

export type StorageId = Storage['id'];

/** Where a food goes when nothing says where it belongs. */
export const DEFAULT_STORAGE: StorageId = 'fridge';

const BY_ID = new Map<string, Storage>(STORAGES.map((storage) => [storage.id, storage]));

export function storageOf(id: StorageId): Storage {
  const storage = BY_ID.get(id);
  if (!storage) {
    // The types rule this out. If it happens anyway, fail loudly, not with a wrong date.
    throw new Error(`Unknown storage place: ${id}`);
  }
  return storage;
}
