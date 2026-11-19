import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { HouseholdProvider } from '@/data/HouseholdProvider';
import { SessionProvider, useSession } from '@/features/auth/session';
import { radius, useColors } from '@/theme/theme';

// Keep the launch screen up until the saved session has been read. Without this,
// someone who is already signed in would see the login page flash by.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      {/* The household data needs to know who is signed in, so it sits inside. */}
      <HouseholdProvider>
        <RootNavigator />
      </HouseholdProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  const colors = useColors();
  const isSignedIn = session !== null;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  // The native iOS sheet, as tall as its content (design/components/BottomSheet.md).
  const sheet = {
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: true,
    sheetCornerRadius: radius.sheet,
    contentStyle: { backgroundColor: colors.surface },
  } as const;

  // Each guard decides which screens exist. When someone signs in or out, the
  // router moves them to the right side by itself.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={sheet} />
        <Stack.Screen name="add-food" options={sheet} />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
