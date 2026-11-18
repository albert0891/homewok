/**
 * The copy kept on the phone: the household's rows and the changes still waiting.
 *
 * TanStack Query writes the data client's state into the phone's storage whenever
 * it changes, at most once a second, and reads it back when the app starts. What it
 * reads back is checked before the app uses it, like rows from Supabase.
 */
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { hashKey } from '@tanstack/react-query';
import type {
  AsyncStorage,
  PersistedClient,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';

import { changesSchema } from './changes';
import { CHANGES_KEY, HOUSEHOLD_KEY } from './household';
import { householdDataSchema } from './rows';

/** Where the copy is kept in the phone's storage. */
const STORAGE_KEY = 'homewok.household';

/** How one account's copy is saved and read back. */
export function savedCopyOptions(
  storage: AsyncStorage<string>,
  userId: string,
): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister: createAsyncStoragePersister({
      storage,
      key: STORAGE_KEY,
      deserialize: readSavedCopy,
    }),
    // The copy is marked with its account. Another account's copy is thrown away
    // instead of shown, and the next one is saved in its place.
    buster: userId,
    // A copy never gets too old: a change made offline waits as long as it takes.
    maxAge: Infinity,
    dehydrateOptions: {
      // Keep the rows even when the last read failed. They are still the best copy.
      shouldDehydrateQuery: (query) => query.state.data !== undefined,
      // Keep every change the database has not confirmed, also one that was on its
      // way when the app closed. Sending it again is safe.
      shouldDehydrateMutation: (mutation) => mutation.state.status === 'pending',
    },
  };
}

/**
 * Reads the saved copy back. Unless the rows and every waiting change pass their
 * checks, it refuses the whole copy, and TanStack Query then throws it away.
 */
export function readSavedCopy(text: string): PersistedClient {
  const saved = JSON.parse(text) as PersistedClient;

  for (const query of saved.clientState.queries) {
    if (hashKey(query.queryKey) !== hashKey(HOUSEHOLD_KEY)) {
      throw new Error(`The saved copy holds a query this app does not know: ${query.queryHash}`);
    }
    query.state.data = householdDataSchema.parse(query.state.data);
  }

  for (const mutation of saved.clientState.mutations) {
    if (hashKey(mutation.mutationKey ?? []) !== hashKey(CHANGES_KEY)) {
      throw new Error('The saved copy holds a change this app does not know.');
    }
    mutation.state.variables = changesSchema.parse(mutation.state.variables);
  }

  return saved;
}
