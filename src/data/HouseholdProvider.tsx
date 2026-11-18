/**
 * Gives the signed-in person's screens their household data.
 *
 * Each account gets its own data client and its own copy on the phone. When the
 * account changes, everything inside this provider starts again from scratch, so
 * nothing of one account can show up for another.
 */
import { focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Network from 'expo-network';
import Storage from 'expo-sqlite/kv-store';
import { type PropsWithChildren, useState } from 'react';
import { Alert, AppState } from 'react-native';

import { useSession } from '@/features/auth/session';

import { createHouseholdClient, sendWaitingChanges } from './household';
import { savedCopyOptions } from './savedCopy';
import { supabaseRemote } from './supabaseRemote';

// TanStack Query cannot see by itself when a phone goes offline or when the app
// comes back to the screen. These two tell it.
onlineManager.setEventListener((setOnline) => {
  // Unknown counts as online: a try that fails is tried again, while waiting for a
  // connection that is already there would wait forever.
  const update = (state: Network.NetworkState) => setOnline(state.isConnected !== false);
  // The listener only reports changes, so ask once how things are now.
  Network.getNetworkStateAsync().then(update, () => undefined);
  const subscription = Network.addNetworkStateListener(update);
  return () => subscription.remove();
});

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (status) =>
    setFocused(status === 'active'),
  );
  return () => subscription.remove();
});

export function HouseholdProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const userId = session?.user.id;

  // Signed out, or the saved session is still being read. No screen needs the data
  // then, and the copy on the phone stays as it is.
  if (!userId) {
    return children;
  }
  return (
    <AccountData key={userId} userId={userId}>
      {children}
    </AccountData>
  );
}

function AccountData({ userId, children }: PropsWithChildren<{ userId: string }>) {
  const [client] = useState(() => createHouseholdClient(userId, supabaseRemote, reportRefused));
  const [persistOptions] = useState(() => savedCopyOptions(Storage, userId));

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={persistOptions}
      onSuccess={() => sendWaitingChanges(client)}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/** A change the database refused has already been undone on screen. This says so. */
function reportRefused(error: unknown) {
  if (__DEV__) {
    console.warn('[data] The database refused a change:', error instanceof Error ? error.message : error);
  }
  Alert.alert('Couldn’t save that change', 'It was undone.');
}
