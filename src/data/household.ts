/**
 * The household's data on the phone: reading it from the database, and saving
 * changes through a queue that waits for the network.
 *
 * Screens read one thing, the household's rows, and save one thing, Changes.
 * TanStack Query does the work underneath:
 * - The rows are one query. A copy of it is kept on the phone (savedCopy.ts), so the
 *   kitchen opens without a connection.
 * - Each saved action is one mutation: one call of apply_changes. Mutations go out
 *   one at a time, in the order they were made. Without a connection they wait, and
 *   they go out once the phone is back online.
 * - Until the database has confirmed a change, screens show the copy with the
 *   waiting changes applied on top, so an edit shows at once, offline too. A change
 *   the database refuses stops being applied, so it is undone on screen by itself.
 *
 * Nothing here talks to Supabase directly. The app passes in a Remote
 * (supabaseRemote.ts), and the tests pass in a fake one.
 */
import { QueryClient, useMutation, useMutationState, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { applyChanges, type Changes } from './changes';
import { type HouseholdData, householdDataSchema } from './rows';

/** The query that holds the household's rows. */
export const HOUSEHOLD_KEY = ['household'];

/** The mutations that send Changes to the database. */
export const CHANGES_KEY = ['changes'];

/** Changes the database has not confirmed yet: on their way, or waiting for the network. */
export const WAITING = { mutationKey: CHANGES_KEY, status: 'pending' } as const;

/** What the data layer needs from the database. */
export type Remote = {
  /** Reads the household's rows. They are checked here, so they may arrive in any shape. */
  load: (signal: AbortSignal) => Promise<unknown>;
  /** Sends one action's changes to apply_changes. */
  send: (changes: Changes) => Promise<void>;
  /** The account signed in on this phone right now, or null. */
  signedInUserId: () => Promise<string | null>;
};

/**
 * A request the database answered with an error, or did not answer at all.
 * `status` is the HTTP status code, and 0 when no answer arrived.
 */
export class RemoteError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RemoteError';
  }
}

/** A change made by an account that is no longer signed in on this phone. */
export class SignedOutError extends Error {
  constructor() {
    super('The account that made this change is no longer signed in.');
    this.name = 'SignedOutError';
  }
}

/**
 * Answers that mean "not now" rather than "no". 0 is no answer at all, 401 is a
 * sign-in that ran out and is being renewed, and 408 and 429 ask to come back later.
 * 500 and up are trouble on the server's side. Every other answer means "no".
 */
const TRY_AGAIN_STATUSES = new Set([0, 401, 408, 429]);

export function isTemporary(error: unknown): boolean {
  return (
    error instanceof RemoteError && (TRY_AGAIN_STATUSES.has(error.status) || error.status >= 500)
  );
}

/** How many more times a read is tried before screens hear that it failed. */
const READ_RETRIES = 3;

/**
 * Makes the data client for one signed-in account. Each account gets its own, so
 * one account's copy and waiting changes never mix with another's.
 *
 * `onRefused` hears about each change the database refused. That change is dropped,
 * so screens stop showing it.
 */
export function createHouseholdClient(
  userId: string,
  remote: Remote,
  onRefused: (error: unknown) => void,
): QueryClient {
  const client = new QueryClient();

  client.setQueryDefaults(HOUSEHOLD_KEY, {
    queryFn: async ({ signal }) => householdDataSchema.parse(await remote.load(signal)),
    // Keep the rows for as long as the app runs, even while no screen shows them.
    gcTime: Infinity,
    // A row that fails its check would fail again, so only a temporary problem is retried.
    retry: (failureCount, error) => failureCount < READ_RETRIES && isTemporary(error),
  });

  client.setMutationDefaults(CHANGES_KEY, {
    mutationFn: async (changes: Changes) => {
      // A change must never be sent for someone else, even if the account changed
      // while it was waiting.
      if ((await remote.signedInUserId()) !== userId) {
        throw new SignedOutError();
      }
      await remote.send(changes);
    },
    // One at a time, in the order they were made: a food reaches the database before
    // its purchase does, and a removal comes after what it removes.
    scope: { id: 'changes' },
    // A temporary problem is tried again for as long as it takes, at most 30 seconds
    // apart, and not at all while the phone is offline. Sending a change a second
    // time is safe, because apply_changes then ends in the same state.
    retry: (_failureCount, error) => isTemporary(error),
    onSuccess: (_result: void, changes: Changes) => {
      // The database has the change, so the copy gets it too. Without this, the change
      // would flicker off the screen until the household has been read again.
      client.setQueryData<HouseholdData>(HOUSEHOLD_KEY, (data) => data && applyChanges(data, changes));
      // Read it again all the same. This also cancels a read that started before the
      // change arrived, which would bring the old rows back.
      void client.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
    },
    onError: (error: unknown) => {
      // After a sign-out there is nobody to tell.
      if (!(error instanceof SignedOutError)) {
        onRefused(error);
      }
    },
  });

  return client;
}

/** The rows as screens show them: the copy, with the waiting changes applied in order. */
export function withWaitingChanges(data: HouseholdData, waiting: Changes[]): HouseholdData {
  return waiting.reduce(applyChanges, data);
}

/**
 * Starts sending the changes that were still waiting when the app closed, in the
 * order they were made. It does not wait for them: offline, they keep waiting until
 * the phone is back online.
 */
export function sendWaitingChanges(client: QueryClient): void {
  for (const mutation of client.getMutationCache().findAll(WAITING)) {
    // A change that fails is reported by onError above, so nothing is lost here.
    mutation.continue().catch(() => undefined);
  }
}

/** What screens get from useHousehold. */
export type Household = {
  /** The rows to show, or undefined while there is no copy yet. */
  data: HouseholdData | undefined;
  /** Why the last read failed, or null. When there is a copy, it is still shown. */
  error: Error | null;
  /** How many changes the database has not confirmed yet. */
  waiting: number;
  /** Reads the household again, for a screen's Try again. */
  reload: () => void;
};

/** The household's rows, with every change that is still waiting already in them. */
export function useHousehold(): Household {
  const query = useQuery<HouseholdData>({ queryKey: HOUSEHOLD_KEY });
  const waiting = useMutationState({
    filters: WAITING,
    select: (mutation) => mutation.state.variables as Changes,
  });

  const data = useMemo(
    () => query.data && withWaitingChanges(query.data, waiting),
    [query.data, waiting],
  );
  const { refetch } = query;
  // refetch never throws: a failed read ends up in `error`, which the screen shows.
  const reload = useCallback(() => void refetch(), [refetch]);

  return { data, error: query.error, waiting: waiting.length, reload };
}

/** Saves one action's changes. Screens show them at once, and the queue sends them. */
export function useSaveChanges(): (changes: Changes) => void {
  const { mutate } = useMutation<void, Error, Changes>({ mutationKey: CHANGES_KEY });
  return mutate;
}
