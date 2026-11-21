import { Pressable, StyleSheet, Text } from 'react-native';

import { type Colors, radius, space, type, useColors } from '@/theme/theme';

/** How a chip looks picked and not picked. Fill, outline, and weight change together, never color alone. */
function looks(colors: Colors) {
  return {
    picked: { fill: colors.accentTint, outline: colors.accentInk, label: colors.accentInk, weight: '600' },
    unpicked: { fill: colors.surface, outline: colors.controlBorder, label: colors.ink, weight: '400' },
  } as const;
}

/** A chip is drawn 36pt tall, and this makes it as easy to hit as a 44pt control. */
const HIT_SLOP = { top: 4, bottom: 4 };

type ChipProps = {
  /** Short: a food name or an amount, such as "½ lb". */
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** A small capsule for a quick choice, such as a one-tap amount (design/components/Chip.md). */
export function Chip({ label, selected, onPress }: ChipProps) {
  const look = looks(useColors())[selected ? 'picked' : 'unpicked'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: look.fill, borderColor: look.outline },
        pressed && styles.pressed,
      ]}>
      <Text style={[type.subhead, { color: look.label, fontWeight: look.weight }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space[3],
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.6,
  },
});
