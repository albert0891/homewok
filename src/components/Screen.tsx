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
  /**
   * The content is a list that scrolls by itself, such as a SectionList. Screen then
   * leaves the scrolling to it, since a list inside a ScrollView would lose its own.
   * The list should set contentInsetAdjustmentBehavior="automatic", so its rows can
   * pass under the tab bar but the last one still ends above it.
   */
  list?: boolean;
}>;

/**
 * The frame every tab shares: the canvas, the safe area, a large serif title, and
 * the gear that opens Settings. The gear sits in the same place on every tab, so
 * nobody has to remember which tab has it.
 */
export function Screen({ title, list = false, children }: ScreenProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    // The safe area keeps the content clear of the status bar and the tab bar.
    // A list runs on under the tab bar, and iOS insets its rows to clear the bar.
    <SafeAreaView
      edges={list ? ['top'] : ['top', 'bottom']}
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
      {list ? (
        <View style={styles.list}>{children}</View>
      ) : (
        // A ScrollView, so nothing is cut off at the largest text sizes.
        <ScrollView contentContainerStyle={styles.body} alwaysBounceVertical={false}>
          {children}
        </ScrollView>
      )}
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
  list: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: space[4],
  },
});
