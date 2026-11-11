import Svg, { Path } from 'react-native-svg';

import { DoodlePaths, Ink } from '@/components/Doodle';

// The drawing is laid out on a 200 x 101 box: the wok in the middle, the shelf under it.
const BOX = { width: 200, height: 101 };

/**
 * The login page shows its one drawing a little larger than the doodle files are
 * drawn, so the pen lines come out about as heavy as the letters of the name below.
 */
const SCALE = 1.25;

/** Puts the wok's bowl in the middle of the box, with its lowest line on the shelf. */
const WOK = { x: 41, y: 13.75 };

/** The shelf line, a little uneven like the doodles, and the two brackets under it. */
const SHELF = [
  'M8 81 C 60 79.6, 130 82.6, 192 80.6',
  'M40 85 C 40.6 90, 39.6 94, 40 97',
  'M40 97 C 45 93, 49 89, 52 85',
  'M160 85 C 159.4 90, 160.4 94, 160 97',
  'M160 97 C 155 93, 151 89, 148 85',
];

/** The login page's drawing: the steaming wok standing on a drawn shelf. */
export function Shelf() {
  return (
    <Svg
      width={BOX.width * SCALE}
      height={BOX.height * SCALE}
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}>
      <Ink>
        <DoodlePaths name="wok" x={WOK.x} y={WOK.y} />
        {SHELF.map((path) => (
          <Path key={path} d={path} />
        ))}
      </Ink>
    </Svg>
  );
}
