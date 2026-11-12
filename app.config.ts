import type { ExpoConfig } from 'expo/config';

import tokens from './design/tokens.json';

// The launch screen is a plain "canvas" color, read from the design tokens so it
// always matches the first screen of the app.
const canvas = tokens.color.tokens.find((token) => token.name === 'canvas')?.value;
if (!canvas) {
  throw new Error('design/tokens.json has no "canvas" color.');
}

// After signing in, Google returns to the app through a URL scheme, which is the
// iOS client ID with its parts reversed. It is built into the native app, so
// rebuild the app after changing it (see docs/setup.md).
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleSignIn: [string, { iosUrlScheme: string }][] = googleIosClientId
  ? [
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: googleIosClientId.split('.').reverse().join('.') },
      ],
    ]
  : [];

const config: ExpoConfig = {
  name: 'Homewok',
  slug: 'homewok',
  version: '1.0.0',
  scheme: 'homewok',
  platforms: ['ios'],
  orientation: 'portrait',
  // Follow the phone's light or dark setting.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.albert.homewok',
    supportsTablet: false,
    // The app icon is an Icon Composer file: two drawn layers, plus their colors for
    // light, dark, and tinted Home Screens. See design/icon/README.md.
    icon: './design/icon/AppIcon.icon',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { backgroundColor: canvas.light, dark: { backgroundColor: canvas.dark } },
    ],
    ...googleSignIn,
  ],
  experiments: {
    // Checks route names such as '/settings' at type-check time.
    typedRoutes: true,
  },
};

export default config;
