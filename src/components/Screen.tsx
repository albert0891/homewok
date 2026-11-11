import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { size, space, useColors } from '@/theme/theme';

import { ICON_SIZE } from './IconButton';
import { Title } from './Title';

type ScreenProps = PropsWithChildren<{
  /** The serif title at the top: "Tonight", "Kitchen". */
  title: string;
  /** An optional icon button at the right end of the title row. */
  trailing?: ReactNode;
}>;

/** The frame every tab shares: the canvas, the safe area, and a large serif title. */
export function Screen({ title, trailing, children }: ScreenProps) {
  const colors = useColors();

  return (
    // The safe area keeps the content clear of the status bar and the tab bar.
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.titleRow}>
        <Title size="largeTitle" style={styles.title}>
          {title}
        </Title>
        {trailing && <View style={styles.trailing}>{trailing}</View>}
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
    // Tall enough for a trailing button, so the title sits at the same height on every tab.
    minHeight: size.tapTarget,
    marginTop: space[2],
  },
  title: {
    flex: 1,
  },
  trailing: {
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
