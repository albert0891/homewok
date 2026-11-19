import { StyleSheet, Text, View } from 'react-native';

import { space, type, useColors } from '@/theme/theme';

import { Button } from './Button';
import { Doodle } from './Doodle';
import type { DoodleName } from './doodles';
import { Title } from './Title';

type EmptyStateProps = {
  /** Every empty screen has one, so no screen looks unfinished beside the others. */
  doodle: DoodleName;
  headline: string;
  /** One plain sentence, two lines at most. */
  sentence: string;
  /**
   * The one thing to do from here, as the screen's primary button: "Add food". A tab
   * whose way to add things is not built yet has none.
   */
  action?: { label: string; onPress: () => void };
};

/** What an empty screen shows: one ink doodle, a serif headline, one sentence, and one action. */
export function EmptyState({ doodle, headline, sentence, action }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.doodle}>
        <Doodle name={doodle} />
      </View>
      <Title size="title2" style={styles.text}>
        {headline}
      </Title>
      <Text style={[type.body, styles.text, styles.sentence, { color: colors.inkMuted }]}>
        {sentence}
      </Text>
      {action && (
        <View style={styles.action}>
          <Button variant="primary" label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  doodle: {
    padding: space[8],
  },
  text: {
    textAlign: 'center',
  },
  sentence: {
    marginTop: space[2],
    maxWidth: 300,
  },
  action: {
    marginTop: space[6],
  },
});
