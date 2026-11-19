import type { Ref } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { radius, size, space, type, useColors } from '@/theme/theme';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'selectionColor'> & {
  ref?: Ref<TextInputInstance>;
};

/**
 * A one-line text field, as design/README.md draws fields: `surface` fill, a
 * `control-border` outline, `radius-md` corners, and `body` text, with the placeholder
 * in `ink-muted`. The text grows with the text size setting, and so does the field.
 */
export function TextField({ ref, ...props }: TextFieldProps) {
  const colors = useColors();

  return (
    <TextInput
      ref={ref}
      {...props}
      placeholderTextColor={colors.inkMuted}
      // The caret and the selection take the accent, as iOS gives them an app's tint.
      selectionColor={colors.accent}
      style={[
        styles.field,
        { backgroundColor: colors.surface, borderColor: colors.controlBorder, color: colors.ink },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    // The body size without its line height: a line height in a one-line field on iOS
    // pushes the text below the middle.
    fontSize: type.body.fontSize,
    minHeight: size.tapTarget,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
