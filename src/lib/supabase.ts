// Gives the app a `localStorage` that expo-sqlite keeps in a small database on the phone.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

import { readEnv } from './env';

const env = readEnv();

/**
 * The one Supabase client for the whole app.
 *
 * The session is saved in localStorage, so someone who signed in stays signed in
 * after closing the app. The publishable key is safe to ship: what a signed-in user
 * may read or change is decided by row-level security in the database.
 */
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Sessions arrive from Google sign-in, never from a link that opens the app.
    detectSessionInUrl: false,
  },
});
