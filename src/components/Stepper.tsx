import { type SFSymbol, SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { radius, size, space, type, useColors } from '@/theme/theme';

type StepperProps = {
  /** The amount as it reads: "1 lb", "2 blocks". */
  value: string;
  /** What VoiceOver calls it: "Amount". */
  label: string;
  onLess: () => void;
  onMore: () => void;
  /** False at the smallest amount, where Less would change nothing. */
  canLess: boolean;
};

/**
 * A capsule with Less and More around the amount, for changing it without the keyboard
 * (design/components/Stepper.md). VoiceOver reads it as one value that can be adjusted:
 * swiping up or down changes it and reads the new amount.
 */
export function Stepper({ value, label, onLess, onMore, canLess }: StepperProps) {
  const colors = useColors();

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'increment') {
          onMore();
        } else if (canLess) {
          onLess();
        }
      }}
      style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.controlBorder }]}>
      <StepButton symbol="minus" onPress={onLess} enabled={canLess} />
      <Text style={[type.headline, styles.value, { color: colors.ink }]}>{value}</Text>
      <StepButton symbol="plus" onPress={onMore} enabled />
    </View>
  );
}

/** The − and + at the default text size. */
const SYMBOL_SIZE = 18;

/** How much the − and + grow with the text size setting, so they stay in step with the amount. */
const SYMBOL_GROWTH = 2;

/** Less or More: a square as big as a fingertip, with its SF Symbol. */
function StepButton({ symbol, onPress, enabled }: { symbol: SFSymbol; onPress: () => void; enabled: boolean }) {
  const colors = useColors();
  const { fontScale } = useWindowDimensions();

  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        !enabled && styles.unavailable,
      ]}>
      <SymbolView
        name={symbol}
        size={SYMBOL_SIZE * Math.min(fontScale, SYMBOL_GROWTH)}
        weight="semibold"
        tintColor={colors.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  button: {
    width: size.tapTarget,
    height: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  // Less at the smallest amount stays in place, faded, the way iOS's own steppers do.
  unavailable: {
    opacity: 0.35,
  },
  value: {
    minWidth: 64,
    paddingHorizontal: space[1],
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
