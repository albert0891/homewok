import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { doodles, INK_WIDTH } from './doodles';

const folder = join(__dirname, '../../design/doodles');

/** 'rice-bowl.svg' -> 'riceBowl' */
function nameFromFile(file: string): string {
  return file.replace('.svg', '').replace(/-(\w)/g, (_match, letter: string) => letter.toUpperCase());
}

const files = readdirSync(folder).filter((file) => file.endsWith('.svg'));

describe('doodles mirror design/doodles/', () => {
  it('has one drawing per .svg file', () => {
    expect(Object.keys(doodles).sort()).toEqual(files.map(nameFromFile).sort());
  });

  it.each(files)('has the same paths and pen width as %s', (file) => {
    const svg = readFileSync(join(folder, file), 'utf8');
    const paths = [...svg.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]);

    expect(doodles[nameFromFile(file) as keyof typeof doodles]).toEqual(paths);
    expect(svg).toContain(`stroke-width="${INK_WIDTH}"`);
  });
});
