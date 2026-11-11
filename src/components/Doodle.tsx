import type { PropsWithChildren } from 'react';
import Svg, { G, Path } from 'react-native-svg';

import { useColors } from '@/theme/theme';

import { DOODLE_BOX, type DoodleName, doodles, INK_WIDTH } from './doodles';

/**
 * Draws everything inside it as loose pen lines in the `ink` color, so drawings stay
 * visible in dark mode. Goes inside an <Svg>.
 */
export function Ink({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <G
      fill="none"
      stroke={colors.ink}
      strokeWidth={INK_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </G>
  );
}

type DoodlePathsProps = {
  name: DoodleName;
  /** Where to place the doodle's box inside a larger drawing. */
  x?: number;
  y?: number;
};

/** The lines of one doodle. Goes inside <Ink>. */
export function DoodlePaths({ name, x = 0, y = 0 }: DoodlePathsProps) {
  return (
    <G transform={`translate(${x} ${y})`}>
      {doodles[name].map((path) => (
        <Path key={path} d={path} />
      ))}
    </G>
  );
}

type DoodleProps = {
  name: DoodleName;
  /** Width on screen. The height follows the box's shape. */
  width?: number;
};

/**
 * One ink doodle. Only for the login page, empty screens, the setup flow, and
 * badges, never beside data.
 */
export function Doodle({ name, width = DOODLE_BOX.width }: DoodleProps) {
  return (
    <Svg
      width={width}
      height={(width * DOODLE_BOX.height) / DOODLE_BOX.width}
      viewBox={`0 0 ${DOODLE_BOX.width} ${DOODLE_BOX.height}`}>
      <Ink>
        <DoodlePaths name={name} />
      </Ink>
    </Svg>
  );
}
