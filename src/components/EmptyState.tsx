import { StyleSheet, Text, View } from 'react-native';

import { space, type, useColors } from '@/theme/theme';

import { Doodle } from './Doodle';
import type { DoodleName } from './doodles';
import { Title } from './Title';

type EmptyStateProps = {
  /** Left out only until the screen's own doodle has been drawn. */
  doodle?: DoodleName;
  headline: string;
  /** One plain sentence, two lines at most. */
  sentence: string;
};

/** What an empty screen shows: one ink doodle, a serif headline, and one sentence. */
export function EmptyState({ doodle, headline, sentence }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {doodle && (
        <View style={styles.doodle}>
          <Doodle name={doodle} />
        </View>
      )}
      <Title size="title2" style={styles.text}>
        {headline}
      </Title>
      <Text style={[type.body, styles.text, styles.sentence, { color: colors.inkMuted }]}>
        {sentence}
      </Text>
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
});
