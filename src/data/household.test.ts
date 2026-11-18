import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';

import { applyChanges, type Changes } from './changes';
import {
  createHouseholdClient,
  HOUSEHOLD_KEY,
  isTemporary,
  type Remote,
  RemoteError,
  SignedOutError,
} from './household';
import {
  fakeRemote,
  ME,
  openScreen,
  save,
  sentChanges,
  settle,
  shown,
  waitingCount,
} from './testRemote';
import { batch, household, id, ingredient, staple } from './testRows';

const salt = staple({ id: id(1), name: 'Salt' });
const tofu = ingredient({ id: id(2), name: 'Tofu' });
const start = household({ ingredients: [salt] });

const lowSalt: Changes = { ingredients: [{ ...salt, status: 'low' }] };
const addTofu: Changes = {
  ingredients: [tofu],
  batches: [batch({ id: id(101), ingredient_id: tofu.id })],
};
const removeTofu: Changes = { removeIngredients: [tofu.id] };

let client: QueryClient;
const onRefused = jest.fn();

let closeScreen = () => {};

/** Starts the data client the way the app does, with a screen that shows the household. */
async function startWith(remote: Remote) {
  client = createHouseholdClient(ME, remote, onRefused);
  client.mount();
  closeScreen = openScreen(client);
  await settle();
}

beforeEach(() => {
  jest.useFakeTimers();
  onRefused.mockClear();
});

afterEach(() => {
  closeScreen();
  closeScreen = () => {};
  client?.unmount();
  client?.clear();
  onlineManager.setOnline(true);
  jest.useRealTimers();
});

describe('saving changes', () => {
  it('shows a change at once, sends it once, and keeps it in the copy', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);

    save(client, lowSalt);
    // Nothing has been sent yet, and the screen already shows it.
    expect(remote.send).not.toHaveBeenCalled();
    expect(shown(client)).toEqual(applyChanges(start, lowSalt));

    await settle();
    expect(sentChanges(remote)).toEqual([lowSalt]);
    expect(server.rows).toEqual(applyChanges(start, lowSalt));
    expect(client.getQueryData(HOUSEHOLD_KEY)).toEqual(applyChanges(start, lowSalt));
    expect(waitingCount(client)).toBe(0);
    // Read once at the start, and once more after the change.
    expect(remote.load).toHaveBeenCalledTimes(2);
  });

  it('keeps a confirmed change on screen while the household is read again', async () => {
    const { remote } = fakeRemote(start);
    await startWith(remote);
    // The read after the change takes a long time.
    remote.load.mockImplementationOnce(() => new Promise(() => {}));

    save(client, lowSalt);
    await settle();

    expect(waitingCount(client)).toBe(0);
    expect(client.isFetching({ queryKey: HOUSEHOLD_KEY })).toBe(1);
    expect(shown(client)).toEqual(applyChanges(start, lowSalt));
  });

  it('keeps changes made offline, in order, and sends each once when back online', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);

    onlineManager.setOnline(false);
    save(client, addTofu);
    save(client, lowSalt);
    save(client, removeTofu);
    await settle();

    expect(remote.send).not.toHaveBeenCalled();
    expect(waitingCount(client)).toBe(3);
    const expected = [addTofu, lowSalt, removeTofu].reduce(applyChanges, start);
    expect(shown(client)).toEqual(expected);

    onlineManager.setOnline(true);
    await settle();

    expect(sentChanges(remote)).toEqual([addTofu, lowSalt, removeTofu]);
    expect(server.rows).toEqual(expected);
    expect(shown(client)).toEqual(expected);
  });

  it('sends one change at a time', async () => {
    const { remote } = fakeRemote(start);
    await startWith(remote);
    let finishFirst = () => {};
    remote.send.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishFirst = resolve)),
    );

    save(client, addTofu);
    save(client, removeTofu);
    await settle();
    expect(sentChanges(remote)).toEqual([addTofu]);

    finishFirst();
    await settle();
    expect(sentChanges(remote)).toEqual([addTofu, removeTofu]);
  });

  it('keeps showing a change that is on its way when the household is read again', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);
    let arrive = () => {};
    remote.send.mockImplementationOnce(
      (changes) =>
        new Promise<void>((resolve) => {
          arrive = () => {
            server.rows = applyChanges(server.rows, changes);
            resolve();
          };
        }),
    );

    save(client, lowSalt);
    await settle();
    // A read lands before the database has the change.
    await client.refetchQueries({ queryKey: HOUSEHOLD_KEY });
    expect(client.getQueryData(HOUSEHOLD_KEY)).toEqual(start);
    expect(shown(client)).toEqual(applyChanges(start, lowSalt));

    arrive();
    await settle();
    expect(shown(client)).toEqual(applyChanges(start, lowSalt));
  });

  it('drops a change the database refuses, says so, and goes on with the next one', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);
    const refusal = new RemoteError(400, 'new row violates check constraint');
    remote.send.mockRejectedValueOnce(refusal);

    save(client, addTofu);
    save(client, lowSalt);
    await settle();

    // Refused once, never tried again, and gone from the screen.
    expect(sentChanges(remote)).toEqual([addTofu, lowSalt]);
    expect(onRefused).toHaveBeenCalledTimes(1);
    expect(onRefused).toHaveBeenCalledWith(refusal);
    expect(shown(client)).toEqual(applyChanges(start, lowSalt));
    expect(server.rows).toEqual(applyChanges(start, lowSalt));
  });

  it('tries again after a temporary problem, for as long as it takes', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);
    // The person moves on to a screen that does not show the household.
    closeScreen();
    closeScreen = () => {};
    for (const status of [0, 0, 503, 502, 0, 401, 0, 500]) {
      remote.send.mockRejectedValueOnce(new RemoteError(status, 'Not now'));
    }

    save(client, lowSalt);
    await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

    expect(remote.send).toHaveBeenCalledTimes(9);
    expect(onRefused).not.toHaveBeenCalled();
    expect(server.rows).toEqual(applyChanges(start, lowSalt));
    // Ten minutes on, the copy is still there, though no screen was looking at it.
    expect(client.getQueryData(HOUSEHOLD_KEY)).toEqual(applyChanges(start, lowSalt));
  });

  it('waits no more than 30 seconds between tries', async () => {
    const { remote } = fakeRemote(start);
    await startWith(remote);
    remote.send.mockRejectedValue(new RemoteError(0, 'Network request failed'));

    save(client, lowSalt);
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
    const triesAfterFiveMinutes = remote.send.mock.calls.length;
    await jest.advanceTimersByTimeAsync(30 * 1000);

    expect(remote.send.mock.calls.length).toBe(triesAfterFiveMinutes + 1);
    expect(waitingCount(client)).toBe(1);
  });

  it('never sends a change after its account has signed out on this phone', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);

    onlineManager.setOnline(false);
    save(client, lowSalt);
    server.signedIn = 'someone-else';
    onlineManager.setOnline(true);
    await settle();

    expect(remote.send).not.toHaveBeenCalled();
    expect(waitingCount(client)).toBe(0);
    // Whoever is using the phone now did not make that change.
    expect(onRefused).not.toHaveBeenCalled();
  });

  it('tries again when it cannot tell who is signed in', async () => {
    const { remote, server } = fakeRemote(start);
    await startWith(remote);
    remote.signedInUserId.mockRejectedValueOnce(new RemoteError(0, 'Network request failed'));

    save(client, lowSalt);
    await jest.advanceTimersByTimeAsync(60 * 1000);

    expect(sentChanges(remote)).toEqual([lowSalt]);
    expect(server.rows).toEqual(applyChanges(start, lowSalt));
  });
});

describe('reading the household', () => {
  it('refuses rows that fail their checks, instead of showing them', async () => {
    const { remote } = fakeRemote(start);
    remote.load.mockResolvedValueOnce({ ...start, batches: [{ ...batch(), amount: -1 }] });
    client = createHouseholdClient(ME, remote, onRefused);

    await expect(client.fetchQuery({ queryKey: HOUSEHOLD_KEY })).rejects.toBeInstanceOf(ZodError);
    // The same rows would fail again, so they are not read again.
    expect(remote.load).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(HOUSEHOLD_KEY)).toBeUndefined();
  });

  it('keeps the last good rows when a later read fails', async () => {
    const { remote } = fakeRemote(start);
    await startWith(remote);
    remote.load.mockRejectedValueOnce(new RemoteError(403, 'permission denied'));

    await client.refetchQueries({ queryKey: HOUSEHOLD_KEY });

    expect(client.getQueryState(HOUSEHOLD_KEY)?.status).toBe('error');
    expect(client.getQueryData(HOUSEHOLD_KEY)).toEqual(start);
  });
});

describe('isTemporary', () => {
  it.each([0, 401, 408, 429, 500, 502, 503, 504])('says an answer of %i means try again later', (status) => {
    expect(isTemporary(new RemoteError(status, ''))).toBe(true);
  });

  it.each([400, 403, 404, 409, 422])('says an answer of %i means no', (status) => {
    expect(isTemporary(new RemoteError(status, ''))).toBe(false);
  });

  it('says anything that is not an answer from the database means no', () => {
    expect(isTemporary(new SignedOutError())).toBe(false);
    expect(isTemporary(new Error('Something broke'))).toBe(false);
    expect(isTemporary('a string')).toBe(false);
  });
});
