/**
 * The settings the app reads from .env.local.
 *
 * Expo builds every EXPO_PUBLIC_ value into the app, where anyone can read it. All
 * four values here are public identifiers, and a secret must never join them.
 */

type Setting = {
  /** The variable name in .env.local. */
  name: string;
  /** Returns what is wrong with the value, or nothing when it is fine. */
  problem?: (value: string) => string | undefined;
};

const GOOGLE_CLIENT_ID_ENDING = '.apps.googleusercontent.com';

function googleClientIdProblem(value: string): string | undefined {
  return value.endsWith(GOOGLE_CLIENT_ID_ENDING)
    ? undefined
    : `should end with ${GOOGLE_CLIENT_ID_ENDING}`;
}

const settings = {
  supabaseUrl: {
    name: 'EXPO_PUBLIC_SUPABASE_URL',
    problem: (value) => (value.startsWith('https://') ? undefined : 'should start with https://'),
  },
  supabasePublishableKey: {
    name: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    problem: (value) =>
      value.startsWith('sb_secret_')
        ? 'is a secret key, which must never be in the app. Use the publishable key'
        : undefined,
  },
  googleWebClientId: { name: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', problem: googleClientIdProblem },
  googleIosClientId: { name: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', problem: googleClientIdProblem },
} satisfies Record<string, Setting>;

type SettingKey = keyof typeof settings;

export type Env = Record<SettingKey, string>;

/**
 * Checks the raw values and returns them trimmed. Throws one error that lists every
 * missing or wrong value, so a setup mistake is clear on the first run.
 */
export function parseEnv(raw: Record<SettingKey, string | undefined>): Env {
  const env = {} as Env;
  const problems: string[] = [];

  for (const key of Object.keys(settings) as SettingKey[]) {
    const setting: Setting = settings[key];
    const value = raw[key]?.trim() ?? '';
    const problem = value === '' ? 'is empty' : setting.problem?.(value);
    if (problem) {
      problems.push(`- ${setting.name} ${problem}`);
    }
    env[key] = value;
  }

  if (env.googleWebClientId !== '' && env.googleWebClientId === env.googleIosClientId) {
    problems.push(
      `- ${settings.googleWebClientId.name} and ${settings.googleIosClientId.name} are the same. Each needs its own client ID`,
    );
  }

  if (problems.length > 0) {
    throw new Error(
      [
        'Homewok cannot start because .env.local is not ready:',
        ...problems,
        'Fill in .env.local (see docs/setup.md), then restart the dev server.',
      ].join('\n'),
    );
  }
  return env;
}

/**
 * Reads the settings Expo built into the app. Each variable has to be written out
 * in full here, because Expo replaces these exact expressions at build time.
 */
export function readEnv(): Env {
  return parseEnv({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}
