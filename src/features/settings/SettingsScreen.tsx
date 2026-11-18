import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Title } from '@/components/Title';
import { signOut } from '@/features/auth/google';
import { useSession } from '@/features/auth/session';
import { SampleKitchenSection } from '@/features/sample/SampleKitchenSection';
import { space, type, useColors } from '@/theme/theme';

type Status = 'idle' | 'busy' | 'failed';

/**
 * The settings sheet. For now it shows who is signed in and lets them sign out, and
 * in development builds it can load the sample kitchen. People, foods to avoid,
 * cuisines, and the reminder join it in milestone 5.
 */
export function SettingsScreen() {
  const colors = useColors();
  const { session } = useSession();
  const [status, setStatus] = useState<Status>('idle');
  const email = session?.user.email;

  async function handleSignOut() {
    setStatus('busy');
    const signedOut = await signOut();
    // After a sign-out the root layout swaps to the login page and this sheet
    // goes away, so only a failure needs handling here.
    if (!signedOut) {
      setStatus('failed');
    }
  }

  return (
    // The sheet fits its content. At the largest text sizes that is taller than the
    // screen, so it scrolls.
    <ScrollView contentContainerStyle={styles.sheet} alwaysBounceVertical={false}>
      <Title size="title2">Settings</Title>

      {email && (
        <View>
          <Text style={[type.subhead, { color: colors.inkMuted }]}>Signed in as</Text>
          {/* A long address keeps both ends, so the sheet never grows past the screen. */}
          <Text numberOfLines={2} ellipsizeMode="middle" style={[type.body, { color: colors.ink }]}>
            {email}
          </Text>
        </View>
      )}

      {status === 'failed' && (
        <Text accessibilityRole="alert" style={[type.subhead, { color: colors.ink }]}>
          Couldn’t sign out. Try again.
        </Text>
      )}
      <Button label="Sign out" onPress={handleSignOut} busy={status === 'busy'} />

      {/* __DEV__ is false in a release build, so the section is not there at all. */}
      {__DEV__ && <SampleKitchenSection />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: space[4],
    paddingTop: space[8],
    paddingBottom: space[6],
    gap: space[6],
  },
});
