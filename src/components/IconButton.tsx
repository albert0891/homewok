import { type SFSymbol, SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { size, useColors } from '@/theme/theme';

type IconButtonProps = {
  /** An SF Symbol name, from Apple's built-in icon set. */
  symbol: SFSymbol;
  /** What VoiceOver reads, because the button has no visible text. */
  label: string;
  onPress: () => void;
};

export const ICON_SIZE = 24;

/** A button that shows only an icon, at the smallest size a finger can hit. */
export function IconButton({ symbol, label, onPress }: IconButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView name={symbol} size={ICON_SIZE} tintColor={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.tapTarget,
    height: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
