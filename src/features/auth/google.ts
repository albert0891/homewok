import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { readEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';

const env = readEnv();

// The web client ID is what Supabase checks the ID token against. The iOS client ID
// identifies this app to Google.
GoogleSignin.configure({
  webClientId: env.googleWebClientId,
  iosClientId: env.googleIosClientId,
});

/** Prints the real reason to the dev server's terminal. People only see a short message. */
function report(step: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[auth] ${step}:`, error instanceof Error ? error.message : error);
  }
}

export type SignInResult = 'signed-in' | 'cancelled' | 'failed';

/**
 * Signs in with Google in two steps. Google shows its account sheet and returns an
 * ID token, a signed note that says who the person is. Supabase checks that note
 * and starts a session, which SessionProvider then picks up.
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return 'cancelled';
    }

    const { idToken } = response.data;
    if (!idToken) {
      report('Google sign-in', 'Google returned no ID token.');
      return 'failed';
    }

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) {
      report('Supabase sign-in', error);
      return 'failed';
    }
    return 'signed-in';
  } catch (error) {
    report('Sign-in', error);
    return 'failed';
  }
}

/**
 * Signs out on this phone and reports whether it worked.
 *
 * The 'local' scope removes the saved session first and only then tells Supabase,
 * so signing out works without a connection.
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      report('Supabase sign-out', error);
    }

    // Telling Supabase can fail while offline even though the phone is already
    // signed out, so the saved session is what counts.
    const { data } = await supabase.auth.getSession();
    if (data.session !== null) {
      return false;
    }
  } catch (error) {
    report('Sign-out', error);
    return false;
  }

  // Forget the Google account too, so the next sign-in can pick a different one.
  await GoogleSignin.signOut().catch((error: unknown) => report('Google sign-out', error));
  return true;
}
