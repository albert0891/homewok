import tokens from '../../design/tokens.json';
import { colors, radius, size, space, type } from './theme';

/** 'ink-muted' -> 'inkMuted', 'title-1' -> 'title1' */
function camelCase(name: string): string {
  return name.replace(/-(\w)/g, (_match, letter: string) => letter.toUpperCase());
}

/** '16px' -> 16 */
function px(value: string): number {
  return Number(value.replace('px', ''));
}

/** Turns [{ name: 'space-4', value: '16px' }] into { 4: 16 } for the prefix 'space-'. */
function numbersByName(list: { name: string; value: string }[], prefix = ''): Record<string, number> {
  return Object.fromEntries(
    list.map((token) => [camelCase(token.name.replace(prefix, '')), px(token.value)]),
  );
}

describe('theme mirrors design/tokens.json', () => {
  it.each(['light', 'dark'] as const)('has the same %s colors', (theme) => {
    const expected = Object.fromEntries(
      tokens.color.tokens.map((token) => [camelCase(token.name), token.value[theme]]),
    );
    expect(colors[theme]).toEqual(expected);
  });

  it('has the same spacing, radius, and size values', () => {
    expect(space).toEqual(numbersByName(tokens.spacing.tokens, 'space-'));
    expect(radius).toEqual(numbersByName(tokens.radius.tokens, 'radius-'));
    expect(size).toEqual(numbersByName(tokens.size.tokens));
  });

  it('has the same text styles', () => {
    const expected = Object.fromEntries(
      tokens.type.groups.flatMap((group) =>
        group.styles.map((style) => [
          camelCase(style.name),
          {
            // Only titles name a font. Everything else uses the system font.
            ...(group.family === 'serif' ? { fontFamily: 'ui-serif' } : {}),
            fontSize: px(style.fontSize),
            lineHeight: px(style.lineHeight),
            fontWeight: String(style.fontWeight),
          },
        ]),
      ),
    );
    expect(type).toEqual(expected);
  });
});
