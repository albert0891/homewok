import { parseEnv } from './env';

const valid = {
  supabaseUrl: 'https://abcdefgh.supabase.co',
  supabasePublishableKey: 'sb_publishable_abc123',
  googleWebClientId: '111-web.apps.googleusercontent.com',
  googleIosClientId: '111-ios.apps.googleusercontent.com',
};

describe('parseEnv', () => {
  it('returns the values when all four are filled in', () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it('trims spaces left over from copying', () => {
    const env = parseEnv({ ...valid, supabaseUrl: '  https://abcdefgh.supabase.co \n' });
    expect(env.supabaseUrl).toBe('https://abcdefgh.supabase.co');
  });

  it('lists every missing value in one error', () => {
    const empty = {
      supabaseUrl: undefined,
      supabasePublishableKey: '',
      googleWebClientId: '   ',
      googleIosClientId: undefined,
    };
    expect(() => parseEnv(empty)).toThrow(
      [
        '- EXPO_PUBLIC_SUPABASE_URL is empty',
        '- EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty',
        '- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is empty',
        '- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is empty',
      ].join('\n'),
    );
  });

  it('refuses a Supabase secret key', () => {
    expect(() => parseEnv({ ...valid, supabasePublishableKey: 'sb_secret_abc123' })).toThrow(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a secret key',
    );
  });

  it('refuses a Supabase URL that is not https', () => {
    expect(() => parseEnv({ ...valid, supabaseUrl: 'abcdefgh.supabase.co' })).toThrow(
      'EXPO_PUBLIC_SUPABASE_URL should start with https://',
    );
  });

  it('refuses a Google client ID with the wrong ending', () => {
    expect(() => parseEnv({ ...valid, googleIosClientId: 'com.googleusercontent.apps.111-ios' })).toThrow(
      'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID should end with .apps.googleusercontent.com',
    );
  });

  it('refuses the same Google client ID in both places', () => {
    expect(() => parseEnv({ ...valid, googleIosClientId: valid.googleWebClientId })).toThrow(
      'are the same',
    );
  });
});
