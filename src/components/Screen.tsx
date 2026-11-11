import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { size, space, useColors } from '@/theme/theme';

import { ICON_SIZE, IconButton } from './IconButton';
import { Title } from './Title';

type ScreenProps = PropsWithChildren<{
  /** The serif title at the top: "Tonight", "Kitchen". */
  title: string;
}>;

/**
 * The frame every tab shares: the canvas, the safe area, a large serif title, and
 * the gear that opens Settings. The gear sits in the same place on every tab, so
 * nobody has to remember which tab has it.
 */
export function Screen({ title, children }: ScreenProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    // The safe area keeps the content clear of the status bar and the tab bar.
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.titleRow}>
        <Title size="largeTitle" style={styles.title}>
          {title}
        </Title>
        <View style={styles.gear}>
          <IconButton
            symbol="gearshape"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>
      {/* A ScrollView, so nothing is cut off at the largest text sizes. */}
      <ScrollView contentContainerStyle={styles.body} alwaysBounceVertical={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[2],
  },
  title: {
    flex: 1,
  },
  gear: {
    // An icon button's tap area is wider than its icon. Pulling it into the gutter
    // lines the icon itself up with the edge of the content.
    marginRight: -(size.tapTarget - ICON_SIZE) / 2,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: space[4],
  },
});
