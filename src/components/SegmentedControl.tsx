import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme/theme';

/** A segment is drawn 36pt tall, and this makes it as easy to hit as a 44pt control. */
const HIT_SLOP = { top: 4, bottom: 4 };

type Option<Value extends string> = { value: Value; label: string };

type SegmentedControlProps<Value extends string> = {
  /** Two or three of them. */
  options: readonly Option<Value>[];
  selected: Value;
  onChange: (value: Value) => void;
};

/**
 * A row of two or three choices with one of them on: the unit and the storage place
 * in the edit sheet (design/components/SegmentedControl.md).
 */
export function SegmentedControl<Value extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<Value>) {
  const colors = useColors();

  return (
    <View
      style={[styles.control, { backgroundColor: colors.surface, borderColor: colors.controlBorder }]}>
      {options.map((option) => {
        const on = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            hitSlop={HIT_SLOP}
            style={({ pressed }) => [
              styles.segment,
              on && { backgroundColor: colors.accentTint },
              pressed && !on && styles.pressed,
            ]}>
            <Text
              // One line: with very large text a word shrinks to fit its segment, as in
              // iOS's own segmented controls, rather than breaking in the middle.
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              style={[
                type.subhead,
                styles.label,
                { color: on ? colors.accentInk : colors.ink },
                on && styles.onLabel,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    padding: 2,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
    // Inside the outline's 2pt of padding, so the corners stay parallel.
    borderRadius: radius.md - 2,
  },
  label: {
    textAlign: 'center',
  },
  // The picked segment is bolder too, so it never differs by color alone.
  onLabel: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
