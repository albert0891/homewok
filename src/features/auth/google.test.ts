import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { supabase } from '@/lib/supabase';

import { signInWithGoogle, signOut } from './google';

// Google and Supabase are replaced with fakes, so these tests never touch the
// network. They check what the app does with each possible answer.
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), signIn: jest.fn(), signOut: jest.fn() },
  isSuccessResponse: (response: { type: string }) => response.type === 'success',
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn(), signOut: jest.fn(), getSession: jest.fn() } },
}));
jest.mock('@/lib/env', () => ({
  readEnv: () => ({ googleWebClientId: 'web-client-id', googleIosClientId: 'ios-client-id' }),
}));

const google = jest.mocked(GoogleSignin);
const auth = jest.mocked(supabase.auth);

/** Stands in for the larger objects the real libraries return. */
function fake<T>(value: unknown): T {
  return value as T;
}

const googleSuccess = fake<Awaited<ReturnType<typeof GoogleSignin.signIn>>>({
  type: 'success',
  data: { idToken: 'google-id-token' },
});

beforeEach(() => {
  jest.resetAllMocks();
  // The code under test prints the reason for each failure. Keep the test output quiet.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('signInWithGoogle', () => {
  it('hands the Google ID token to Supabase', async () => {
    google.signIn.mockResolvedValue(googleSuccess);
    auth.signInWithIdToken.mockResolvedValue(fake({ error: null }));

    await expect(signInWithGoogle()).resolves.toBe('signed-in');
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token',
    });
  });

  it('is cancelled when the person closes the Google sheet', async () => {
    google.signIn.mockResolvedValue(fake({ type: 'cancelled', data: null }));

    await expect(signInWithGoogle()).resolves.toBe('cancelled');
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('fails when Google returns no ID token', async () => {
    google.signIn.mockResolvedValue(fake({ type: 'success', data: { idToken: null } }));

    await expect(signInWithGoogle()).resolves.toBe('failed');
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('fails when Supabase rejects the token', async () => {
    google.signIn.mockResolvedValue(googleSuccess);
    auth.signInWithIdToken.mockResolvedValue(fake({ error: new Error('Unacceptable audience') }));

    await expect(signInWithGoogle()).resolves.toBe('failed');
  });

  it('fails instead of throwing when Google throws', async () => {
    google.signIn.mockRejectedValue(new Error('missing URL scheme'));

    await expect(signInWithGoogle()).resolves.toBe('failed');
  });

  it('fails instead of throwing when the network is down', async () => {
    google.signIn.mockResolvedValue(googleSuccess);
    auth.signInWithIdToken.mockRejectedValue(new Error('Network request failed'));

    await expect(signInWithGoogle()).resolves.toBe('failed');
  });
});

describe('signOut', () => {
  const noSession = fake<Awaited<ReturnType<typeof supabase.auth.getSession>>>({
    data: { session: null },
  });
  const stillSignedIn = fake<typeof noSession>({ data: { session: { access_token: 'token' } } });

  beforeEach(() => {
    google.signOut.mockResolvedValue(null);
  });

  it('signs out of Supabase on this phone only, then forgets the Google account', async () => {
    auth.signOut.mockResolvedValue({ error: null });
    auth.getSession.mockResolvedValue(noSession);

    await expect(signOut()).resolves.toBe(true);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(google.signOut).toHaveBeenCalled();
  });

  it('counts as signed out when offline, because the saved session is gone', async () => {
    auth.signOut.mockResolvedValue(fake({ error: new Error('Network request failed') }));
    auth.getSession.mockResolvedValue(noSession);

    await expect(signOut()).resolves.toBe(true);
  });

  it('reports a failure when the session is still saved', async () => {
    auth.signOut.mockResolvedValue(fake({ error: new Error('storage is full') }));
    auth.getSession.mockResolvedValue(stillSignedIn);

    await expect(signOut()).resolves.toBe(false);
    expect(google.signOut).not.toHaveBeenCalled();
  });

  it('reports a failure instead of throwing when Supabase throws', async () => {
    auth.signOut.mockRejectedValue(new Error('storage is broken'));

    await expect(signOut()).resolves.toBe(false);
  });
});
