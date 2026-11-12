/**
 * The ink doodles from design/doodles/, as SVG path data.
 *
 * Each drawing sits on a 120 x 80 box. doodles.test.ts fails when a drawing here
 * differs from its .svg file, so edit the .svg first and then copy the paths over.
 */
export const doodles = {
  wok: [
    'M14 44 C 30 70, 86 72, 104 44',
    'M12 44 C 40 42, 80 45, 106 43',
    'M106 43 L 117 37',
    'M48 34 c -5 -5 4 -8 0 -13 c -4 -5 4 -8 0 -12',
    'M64 34 c -5 -5 4 -8 0 -13 c -4 -5 4 -8 0 -12',
  ],
  scallion: [
    'M20 60 C 44 56, 72 48, 104 20',
    'M22 64 C 48 60, 78 54, 110 30',
    'M22 68 C 50 64, 82 60, 112 44',
    'M12 58 C 6 62, 8 71, 16 71 C 23 71, 25 64, 21 59',
    'M10 71 l -4 6',
    'M14 72 l -1 6',
    'M18 72 l 2 6',
  ],
  egg: [
    'M38 14 C 22 14, 16 44, 22 58 C 28 72, 50 72, 54 58 C 60 44, 54 14, 38 14 Z',
    'M72 40 C 68 26, 88 20, 98 28 C 110 31, 113 46, 103 54 C 97 64, 79 62, 73 54 C 67 50, 67 46, 72 40 Z',
    'M88 34 C 94 34, 97 39, 96 43 C 95 48, 89 50, 85 48 C 81 46, 81 39, 84 36 C 85 35, 86 34, 88 34 Z',
  ],
  riceBowl: [
    'M18 42 C 24 66, 96 68, 102 42',
    'M16 42 C 46 40, 74 43, 104 41',
    'M48 64 C 52 68, 68 68, 72 64',
    'M26 41 C 30 28, 48 24, 58 28 C 68 22, 88 28, 93 41',
    'M44 34 l 3 -1',
    'M58 32 l 3 0',
    'M72 33 l 3 1',
    'M70 22 L 112 6',
    'M74 27 L 114 12',
  ],
  groceryBag: [
    'M28 39 C 27 49, 25 58, 24 65 C 23 69, 26 70, 30 70 C 46 72, 62 72, 76 70 C 80 70, 83 69, 82 65 C 81 57, 79 48, 78 38',
    'M26 39 C 42 37, 62 40, 80 38',
    'M36 45 C 35 16, 58 15, 56 44',
    'M62 38 C 59 26, 67 14, 81 9 C 85 21, 79 32, 68 38',
    'M65 37 C 68 30, 72 23, 77 16',
    'M70 38 C 78 29, 94 20, 112 21 C 110 31, 94 37, 78 38',
    'M74 37 C 82 33, 90 30, 98 27',
  ],
} as const;

export type DoodleName = keyof typeof doodles;

/** The box every doodle is drawn on. */
export const DOODLE_BOX = { width: 120, height: 80 } as const;

/** The pen width, in the same units as the box. */
export const INK_WIDTH = 2.4;
