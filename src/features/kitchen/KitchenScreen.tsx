import { useMemo } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { type Household, useHousehold } from '@/data/household';
import { radius, size, space, type, useColors } from '@/theme/theme';

import { type KitchenRow, type KitchenSection, kitchenSections, rowLabel } from './kitchenList';
import { useToday } from './useToday';

/**
 * From this text size up, a row puts the pill and the amount on a line under the
 * name, as iOS's own lists do. 1.6 is about where iOS's accessibility sizes begin:
 * body text there is 28pt, against 17pt at the default size.
 */
const STACKED_TEXT_SCALE = 1.6;

/**
 * The Kitchen tab: Fridge, Freezer, Pantry, and Staples as inset groups, one row per
 * food (design/components/ListGroup.md). Which rows there are, and what each one
 * says, is decided in kitchenList.ts. This file only draws them.
 */
export function KitchenScreen() {
  const household = useHousehold();
  const today = useToday();
  const { data } = household;
  const sections = useMemo(() => (data ? kitchenSections(data, today) : []), [data, today]);

  // With nothing to list, the screen is laid out like the other tabs' empty states,
  // centered in the same place.
  if (sections.length === 0) {
    return (
      <Screen title="Kitchen">
        <NothingToList household={household} />
      </Screen>
    );
  }
  return (
    <Screen title="Kitchen" list>
      <SectionList
        sections={sections}
        keyExtractor={(row) => row.key}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item, index, section }) => (
          <FoodRow
            row={item}
            section={section}
            first={index === 0}
            last={index === section.data.length - 1}
          />
        )}
        ItemSeparatorComponent={Divider}
        // A header stuck at the top would sit over the rows with no background.
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={false}
        // Rows pass under the glass tab bar, and the last one ends above it.
        contentInsetAdjustmentBehavior="automatic"
      />
    </Screen>
  );
}

/**
 * What the screen shows when there are no rows: the empty kitchen, a read that failed
 * before there was any copy on the phone, or the first read still on its way.
 */
function NothingToList({ household }: { household: Household }) {
  const colors = useColors();

  if (household.data) {
    return (
      <EmptyState
        doodle="scallion"
        headline="Your kitchen is empty"
        sentence="The food you have at home will be listed here."
      />
    );
  }
  if (household.error) {
    return (
      <View style={styles.failed}>
        <Text style={[type.body, styles.failedText, { color: colors.ink }]}>
          Couldn’t load your kitchen.
        </Text>
        <Button label="Try again" onPress={household.reload} />
      </View>
    );
  }
  return <ActivityIndicator accessibilityLabel="Loading your kitchen" />;
}

/**
 * A place's name over its group, in headline and ink: a step stronger than the food
 * names under it, since the place is what the eye looks for first. iOS's own content
 * lists do the same; small gray headers suit a settings form.
 */
function SectionHeader({ title }: { title: string }) {
  const colors = useColors();

  return (
    <Text accessibilityRole="header" style={[type.headline, styles.header, { color: colors.ink }]}>
      {title}
    </Text>
  );
}

type FoodRowProps = {
  row: KitchenRow;
  section: KitchenSection;
  /** The first and last rows round the group's corners. */
  first: boolean;
  last: boolean;
};

/** One food: its name and meta line on the left; the pill or warning and the amount on the right. */
function FoodRow({ row, section, first, last }: FoodRowProps) {
  const colors = useColors();
  const stacked = useWindowDimensions().fontScale >= STACKED_TEXT_SCALE;
  // A staple's Have, Low, or Out is quieter than a real amount.
  const amountColor = section.id === 'staples' ? colors.inkMuted : colors.ink;

  return (
    <View
      // VoiceOver reads the row as one item, in the order it is shown.
      accessible
      accessibilityLabel={rowLabel(row)}
      style={[
        styles.row,
        stacked && styles.stackedRow,
        { backgroundColor: colors.surface },
        first && styles.firstRow,
        last && styles.lastRow,
      ]}>
      <View style={!stacked && styles.main}>
        <Text style={[type.body, { color: colors.ink }]}>{row.name}</Text>
        {row.meta && <Text style={[type.subhead, { color: colors.inkMuted }]}>{row.meta}</Text>}
      </View>
      <View style={[styles.trailing, stacked && styles.stackedTrailing]}>
        {row.pill && (
          <View style={[styles.pill, { backgroundColor: colors.accentTint }]}>
            <Text style={[type.caption, { color: colors.accentInk }]}>{row.pill}</Text>
          </View>
        )}
        {row.warning && (
          <Text style={[type.caption, { color: colors.danger }]}>
            {row.warning}
          </Text>
        )}
        <Text style={[type.body, styles.amount, { color: amountColor }]}>{row.amount}</Text>
      </View>
    </View>
  );
}

/** The hairline between two rows of a group. It is inset like the rows' text. */
function Divider() {
  const colors = useColors();

  return (
    <View style={[styles.dividerSpace, { backgroundColor: colors.surface }]}>
      <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    // Screen leaves the side gutter to the list, so the scroll bar sits at the screen's edge.
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  failed: {
    alignItems: 'center',
    gap: space[4],
  },
  failedText: {
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: size.rowHeight,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  firstRow: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  lastRow: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  stackedRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space[1],
  },
  main: {
    flex: 1,
  },
  // Side by side, this keeps its own width and the name wraps instead, so an amount
  // never breaks inside a word.
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  // Stacked, it has the whole row, and a long warning and the amount may wrap.
  stackedTrailing: {
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  dividerSpace: {
    paddingHorizontal: space[4],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
