import type { PropsWithChildren } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';

import { type, useColors } from '@/theme/theme';

type TitleSize = 'largeTitle' | 'title1' | 'title2' | 'title3';

/**
 * How far each title may grow with the text size setting. React Native grows all
 * text by the same factor, but iOS grows titles less than body text. Each cap is
 * the largest size iOS gives that style, divided by its default size.
 */
const MAX_GROWTH: Record<TitleSize, number> = {
  largeTitle: 60 / 34,
  title1: 58 / 28,
  title2: 56 / 22,
  title3: 55 / 20,
};

type TitleProps = PropsWithChildren<{
  size: TitleSize;
  style?: StyleProp<TextStyle>;
}>;

/**
 * A title in the `ink` color: screen names, dish names, and sheet titles in the serif,
 * and the headers over a list's groups (`title3`) in the system font.
 */
export function Title({ size, style, children }: TitleProps) {
  const colors = useColors();

  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={MAX_GROWTH[size]}
      style={[type[size], { color: colors.ink }, style]}>
      {children}
    </Text>
  );
}
