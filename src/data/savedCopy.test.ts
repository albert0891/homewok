import { onlineManager, type QueryClient } from '@tanstack/react-query';
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client';

import { applyChanges, type Changes } from './changes';
import {
  createHouseholdClient,
  HOUSEHOLD_KEY,
  type Remote,
  RemoteError,
  sendWaitingChanges,
} from './household';
import { savedCopyOptions } from './savedCopy';
import { fakeRemote, ME, save, sentChanges, settle, shown, waitingCount } from './testRemote';
import { household, id, staple } from './testRows';

const salt = staple({ id: id(1), name: 'Salt' });
const sugar = staple({ id: id(2), name: 'Sugar' });
const start = household({ ingredients: [salt, sugar] });
const lowSalt: Changes = { ingredients: [{ ...salt, status: 'low' }] };
const outOfSugar: Changes = { ingredients: [{ ...sugar, status: 'out' }] };

const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'homewok.household';

/** The phone's storage, in memory. */
function phoneStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: async (key: string) => items.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: async (key: string) => {
      items.delete(key);
    },
  };
}

type Storage = ReturnType<typeof phoneStorage>;

const running: QueryClient[] = [];

/** Opens the app the way HouseholdProvider does: a new data client, then the copy read back. */
async function openApp(storage: Storage, remote: Remote, userId = ME): Promise<QueryClient> {
  const client = createHouseholdClient(userId, remote, () => undefined);
  client.mount();
  running.push(client);
  try {
    await persistQueryClientRestore({ queryClient: client, ...savedCopyOptions(storage, userId) });
    sendWaitingChanges(client);
  } catch {
    // The copy was refused and thrown away. The app goes on without it.
  }
  return client;
}

/** Saves the copy the way the app does after every change, without its one-second wait. */
async function saveCopy(client: QueryClient, storage: Storage, userId = ME) {
  await persistQueryClientSave({ queryClient: client, ...savedCopyOptions(storage, userId) });
}

/** Closes the app: the client stops, and only the saved copy is left. */
function closeApp(client: QueryClient) {
  client.unmount();
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  running.splice(0).forEach((client) => {
    client.unmount();
    client.clear();
  });
  onlineManager.setOnline(true);
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the copy on the phone', () => {
  it('shows the kitchen offline after a restart', async () => {
    const storage = phoneStorage();
    const { remote } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    await saveCopy(first, storage);
    closeApp(first);

    onlineManager.setOnline(false);
    const second = await openApp(storage, remote);

    expect(shown(second)).toEqual(start);
    expect(remote.load).toHaveBeenCalledTimes(1);
  });

  it('keeps changes made offline through a restart, and sends each once when back online', async () => {
    const storage = phoneStorage();
    const { remote, server } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });

    onlineManager.setOnline(false);
    save(first, lowSalt);
    save(first, outOfSugar);
    await settle();
    await saveCopy(first, storage);
    closeApp(first);

    const second = await openApp(storage, remote);
    await settle();
    // Still offline: both changes show, and neither has been sent.
    expect(shown(second)).toEqual([lowSalt, outOfSugar].reduce(applyChanges, start));
    expect(waitingCount(second)).toBe(2);
    expect(remote.send).not.toHaveBeenCalled();

    onlineManager.setOnline(true);
    await settle();

    expect(sentChanges(remote)).toEqual([lowSalt, outOfSugar]);
    expect(server.rows).toEqual([lowSalt, outOfSugar].reduce(applyChanges, start));
    expect(waitingCount(second)).toBe(0);
  });

  it('also keeps a change that was on its way when the app closed', async () => {
    const storage = phoneStorage();
    const { remote, server } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    // The connection drops while the change is on its way: no answer ever comes.
    remote.send.mockImplementationOnce(() => new Promise<void>(() => {}));

    save(first, lowSalt);
    await settle();
    await saveCopy(first, storage);
    closeApp(first);

    await openApp(storage, remote);
    await settle();

    // Sent again after the restart. Sending a change twice ends in the same state.
    expect(sentChanges(remote)).toEqual([lowSalt, lowSalt]);
    expect(server.rows).toEqual(applyChanges(start, lowSalt));
  });

  it('keeps the rows when the last read failed', async () => {
    const storage = phoneStorage();
    const { remote } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    remote.load.mockRejectedValueOnce(new RemoteError(403, 'permission denied'));
    await first.refetchQueries({ queryKey: HOUSEHOLD_KEY });
    await saveCopy(first, storage);
    closeApp(first);

    onlineManager.setOnline(false);
    const second = await openApp(storage, remote);

    expect(shown(second)).toEqual(start);
  });

  it('uses a copy however old it is', async () => {
    const storage = phoneStorage();
    const { remote } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    onlineManager.setOnline(false);
    save(first, lowSalt);
    await settle();
    await saveCopy(first, storage);
    closeApp(first);

    jest.setSystemTime(Date.now() + 30 * DAY);
    const second = await openApp(storage, remote);

    expect(shown(second)).toEqual(applyChanges(start, lowSalt));
    expect(waitingCount(second)).toBe(1);
  });

  it('throws away a copy saved by another account', async () => {
    const storage = phoneStorage();
    const { remote } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    onlineManager.setOnline(false);
    save(first, lowSalt);
    await settle();
    await saveCopy(first, storage);
    closeApp(first);

    const other = fakeRemote(household());
    other.server.signedIn = 'someone-else';
    const second = await openApp(storage, other.remote, 'someone-else');
    onlineManager.setOnline(true);
    await settle();

    expect(second.getQueryData(HOUSEHOLD_KEY)).toBeUndefined();
    expect(waitingCount(second)).toBe(0);
    expect(other.remote.send).not.toHaveBeenCalled();
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });
});

describe('checking the copy when it is read back', () => {
  /** Saves a copy with one waiting change, then lets `edit` damage it in storage. */
  async function damagedCopy(edit: (copy: SavedJson) => void) {
    const storage = phoneStorage();
    const { remote } = fakeRemote(start);
    const first = await openApp(storage, remote);
    await first.fetchQuery({ queryKey: HOUSEHOLD_KEY });
    onlineManager.setOnline(false);
    save(first, lowSalt);
    await settle();
    await saveCopy(first, storage);
    closeApp(first);

    const copy = JSON.parse(storage.items.get(STORAGE_KEY) ?? '') as SavedJson;
    edit(copy);
    storage.items.set(STORAGE_KEY, JSON.stringify(copy));
    return { storage, remote };
  }

  type SavedJson = {
    clientState: {
      queries: { state: { data: { ingredients: { status: string }[] } } }[];
      mutations: { state: { variables: { ingredients: { id: string }[] } } }[];
    };
  };

  beforeEach(() => {
    // TanStack Query reports a refused copy in development. That is expected here.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('accepts a copy that passes', async () => {
    const { storage, remote } = await damagedCopy(() => {});

    const second = await openApp(storage, remote);

    expect(shown(second)).toEqual(applyChanges(start, lowSalt));
  });

  it('throws the copy away when a row fails its check', async () => {
    const { storage, remote } = await damagedCopy((copy) => {
      copy.clientState.queries[0].state.data.ingredients[0].status = 'plenty';
    });

    const second = await openApp(storage, remote);

    expect(second.getQueryData(HOUSEHOLD_KEY)).toBeUndefined();
    expect(waitingCount(second)).toBe(0);
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });

  it('throws the copy away when a waiting change fails its check', async () => {
    const { storage, remote } = await damagedCopy((copy) => {
      copy.clientState.mutations[0].state.variables.ingredients[0].id = 'salt';
    });

    const second = await openApp(storage, remote);
    onlineManager.setOnline(true);
    await settle();

    expect(second.getQueryData(HOUSEHOLD_KEY)).toBeUndefined();
    expect(remote.send).not.toHaveBeenCalled();
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });

  it('throws the copy away when it is not a copy at all', async () => {
    const storage = phoneStorage();
    storage.items.set(STORAGE_KEY, '{"clientState": 42}');
    const { remote } = fakeRemote(start);

    const client = await openApp(storage, remote);

    expect(client.getQueryData(HOUSEHOLD_KEY)).toBeUndefined();
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });
});
