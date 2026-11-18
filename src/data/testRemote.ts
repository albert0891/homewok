/**
 * Helpers for the data layer's tests: a database in memory, and what a screen
 * would show.
 */
import { MutationObserver, type QueryClient, QueryObserver } from '@tanstack/react-query';

import { applyChanges, type Changes } from './changes';
import { CHANGES_KEY, HOUSEHOLD_KEY, type Remote, WAITING, withWaitingChanges } from './household';
import type { HouseholdData } from './rows';

/** The account that is signed in during the tests. */
export const ME = 'my-account';

/** A database in memory that answers the way Supabase does. */
export function fakeRemote(rows: HouseholdData) {
  const server = { rows, signedIn: ME as string | null };
  const remote = {
    load: jest.fn(async (_signal: AbortSignal): Promise<unknown> => structuredClone(server.rows)),
    send: jest.fn(async (changes: Changes) => {
      server.rows = applyChanges(server.rows, changes);
    }),
    signedInUserId: jest.fn(async () => server.signedIn),
  } satisfies Remote;
  return { remote, server };
}

/** The changes the database received, in order. */
export function sentChanges(remote: ReturnType<typeof fakeRemote>['remote']): Changes[] {
  return remote.send.mock.calls.map(([changes]) => changes);
}

/** What a screen shows: the copy, with the changes still waiting applied. */
export function shown(client: QueryClient): HouseholdData | undefined {
  const data = client.getQueryData<HouseholdData>(HOUSEHOLD_KEY);
  const waiting = client
    .getMutationCache()
    .findAll(WAITING)
    .map((mutation) => mutation.state.variables as Changes);
  return data && withWaitingChanges(data, waiting);
}

/** How many changes the database has not confirmed yet. */
export function waitingCount(client: QueryClient): number {
  return client.getMutationCache().findAll(WAITING).length;
}

/**
 * A screen that shows the household, the way useHousehold does. While one is open,
 * the household is read when it opens and read again after each change. Returns a
 * function that closes it.
 */
export function openScreen(client: QueryClient): () => void {
  return new QueryObserver(client, { queryKey: HOUSEHOLD_KEY }).subscribe(() => undefined);
}

/** Saves changes the way useSaveChanges does. */
export function save(client: QueryClient, changes: Changes): void {
  new MutationObserver<void, Error, Changes>(client, { mutationKey: CHANGES_KEY })
    .mutate(changes)
    .catch(() => undefined);
}

/** Lets everything that is ready run: promises, and timers that are due. Needs fake timers. */
export function settle(): Promise<void> {
  return jest.advanceTimersByTimeAsync(0);
}
