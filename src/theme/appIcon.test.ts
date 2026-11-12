import { existsSync } from 'node:fs';
import { join } from 'node:path';

import icon from '../../design/icon/AppIcon.icon/icon.json';
import tokens from '../../design/tokens.json';

/** One color of a part of the icon. No `appearance` means the light Home Screen. */
type Fill = { appearance?: string; value: { solid: string } };

/** '#f4ede3' -> 'srgb:0.95686,0.92941,0.89020,1.00000', the way Icon Composer writes a color. */
function iconColor(hex: string): string {
  const channels = [1, 3, 5].map((start) =>
    (parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(5),
  );
  return `srgb:${channels.join(',')},1.00000`;
}

function solid(fills: Fill[], appearance?: string): string | undefined {
  return fills.find((fill) => fill.appearance === appearance)?.value.solid;
}

function tokenValue(name: string) {
  const token = tokens.color.tokens.find((candidate) => candidate.name === name);
  if (!token) {
    throw new Error(`design/tokens.json has no "${name}" color.`);
  }
  return token.value;
}

const layers = icon.groups.flatMap((group) => group.layers);

function layerFills(name: string): Fill[] {
  const layer = layers.find((candidate) => candidate.name === name);
  if (!layer) {
    throw new Error(`The app icon has no "${name}" layer.`);
  }
  return layer['fill-specializations'];
}

/** Which design token colors each part of the icon. */
const PARTS: [part: string, fills: Fill[], token: string][] = [
  ['tile', icon['fill-specializations'], 'canvas'],
  ['roof', layerFills('roof'), 'ink'],
  ['wok', layerFills('wok'), 'accent'],
];

describe('the app icon follows design/tokens.json', () => {
  it.each(PARTS)('colors the %s with the same token in light and dark', (_part, fills, token) => {
    expect(solid(fills)).toBe(iconColor(tokenValue(token).light));
    expect(solid(fills, 'dark')).toBe(iconColor(tokenValue(token).dark));
  });

  it('has a drawing file for every layer', () => {
    const folder = join(__dirname, '../../design/icon/AppIcon.icon/Assets');
    for (const layer of layers) {
      expect(existsSync(join(folder, layer['image-name']))).toBe(true);
    }
  });
});
