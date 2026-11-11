import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title } from '@/components/Title';
import { space, type, useColors } from '@/theme/theme';

import { signInWithGoogle } from './google';
import { GoogleButton } from './GoogleButton';
import { Shelf } from './Shelf';

type Status = 'idle' | 'busy' | 'failed';

/** The login page: the shelf of doodles, the name, the tagline, and one button. */
export function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('idle');

  async function handleContinue() {
    setStatus('busy');
    const result = await signInWithGoogle();
    // After a sign-in the root layout swaps this page for the tabs, so there is
    // nothing to do here. Closing Google's sheet is not an error either.
    if (result === 'failed') {
      setStatus('failed');
    } else if (result === 'cancelled') {
      setStatus('idle');
    }
  }

  return (
    // A ScrollView, so nothing is cut off at the largest text sizes on a small phone.
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space[6], paddingBottom: insets.bottom + space[6] },
      ]}
      alwaysBounceVertical={false}>
      <View style={styles.above} />
      <View style={styles.brand}>
        <Shelf />
        <Title size="largeTitle" style={styles.name}>
          Homewok
        </Title>
        <Text style={[type.body, styles.tagline, { color: colors.inkMuted }]}>
          All wok, no work.
        </Text>
      </View>
      <View style={styles.below} />

      <View style={styles.actions}>
        {status === 'failed' && (
          <Text accessibilityRole="alert" style={[type.subhead, styles.message, { color: colors.ink }]}>
            Couldn’t sign in. Try again in a moment.
          </Text>
        )}
        <GoogleButton onPress={handleContinue} busy={status === 'busy'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: space[8],
  },
  // The empty space is split 1 to 2, so the drawing and the name sit a little above
  // the middle, where the eye expects the center of a page to be.
  above: {
    flexGrow: 1,
  },
  below: {
    flexGrow: 2,
  },
  brand: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
  name: {
    marginTop: space[6],
    textAlign: 'center',
  },
  tagline: {
    marginTop: space[1],
    textAlign: 'center',
  },
  actions: {
    gap: space[3],
  },
  message: {
    textAlign: 'center',
  },
});
