/**
 * The Homewok design tokens, for the app.
 *
 * This file mirrors design/tokens.json, and theme.test.ts fails when the two drift
 * apart. Components read colors by name through useColors(), so they never contain
 * a hex value and never check which theme is on.
 */
import { useColorScheme } from 'react-native';

const light = {
  canvas: '#f4ede3',
  surface: '#ffffff',
  ink: '#2a1e16',
  inkMuted: '#7a6658',
  hairline: '#e6dacb',
  controlBorder: '#8c7a6b',
  accent: '#c2410c',
  onAccent: '#ffffff',
  accentInk: '#9a3412',
  accentTint: '#fde8d7',
  danger: '#b42318',
  focus: '#9a3412',
};

export type Colors = typeof light;

/** Warm charcoal: the same names with dark values. */
const dark: Colors = {
  canvas: '#1c1714',
  surface: '#2a231f',
  ink: '#f3ece6',
  inkMuted: '#b8a99c',
  hairline: '#3a312b',
  controlBorder: '#7d6c60',
  accent: '#f08a4b',
  onAccent: '#1c1714',
  accentInk: '#f08a4b',
  accentTint: '#4a2a1a',
  danger: '#f97066',
  focus: '#f08a4b',
};

export const colors = { light, dark };

/** The colors for the phone's current light or dark setting. */
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

/** A 4px grid. `space[4]` is the screen gutter. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

export const radius = { md: 10, lg: 16, sheet: 24, pill: 9999 } as const;

export const size = { tapTarget: 44, rowHeight: 52 } as const;

/**
 * From this text size up, a row that holds several things puts them on lines of their
 * own, as iOS's own lists do: a Kitchen row, and the amount row in the edit sheet. 1.6 is
 * about where iOS's accessibility sizes begin: body text there is 28pt, against 17pt at
 * the default size.
 */
export const STACKED_TEXT_SCALE = 1.6;

/** Apple's serif, New York. Titles only. */
const serif = 'ui-serif';

/**
 * Text styles at the iOS default sizes. React Native scales them with the user's
 * text size setting, so never put text in a box with a fixed height.
 */
export const type = {
  largeTitle: { fontFamily: serif, fontSize: 34, lineHeight: 41, fontWeight: '400' },
  title1: { fontFamily: serif, fontSize: 28, lineHeight: 34, fontWeight: '400' },
  title2: { fontFamily: serif, fontSize: 22, lineHeight: 28, fontWeight: '400' },
  // iOS's Title 3, in the system font: the headers over a list's groups.
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const;
