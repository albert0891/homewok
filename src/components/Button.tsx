import { Pressable, StyleSheet, Text } from 'react-native';

import { type Colors, radius, size, space, type, useColors } from '@/theme/theme';

type Variant = 'primary' | 'secondary' | 'text';

type Look = { fill: string; outline: string; label: string };

/** The colors of each variant. Primary is for the one main action on a screen. */
function looks(colors: Colors): Record<Variant, Look> {
  return {
    primary: { fill: colors.accent, outline: colors.accent, label: colors.onAccent },
    secondary: { fill: colors.surface, outline: colors.controlBorder, label: colors.ink },
    text: { fill: 'transparent', outline: 'transparent', label: colors.accentInk },
  };
}

type ButtonProps = {
  /** Starts with a verb, in sentence case: "Cook this", "Sign out". */
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** While true, the button fades and ignores presses. */
  busy?: boolean;
};

/** The capsule button from the design system. */
export function Button({ label, onPress, variant = 'secondary', busy = false }: ButtonProps) {
  const look = looks(useColors())[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.fill, borderColor: look.outline },
        (pressed || busy) && styles.dimmed,
      ]}>
      <Text style={[type.headline, styles.label, { color: look.label }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: size.tapTarget,
    paddingHorizontal: space[6],
    paddingVertical: space[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
});
