import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

type SessionState = {
  /** The signed-in session, or null when nobody is signed in. */
  session: Session | null;
  /** True until the saved session has been read from the phone. */
  isLoading: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

/** Who is signed in. Works in any component inside <SessionProvider>. */
export function useSession(): SessionState {
  return useContext(SessionContext);
}

/** Keeps the session in React state, so screens update when someone signs in or out. */
export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    // Supabase calls this once with the saved session (or null), then again on
    // every sign-in, sign-out, and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, isLoading: false });
    });

    // A session is renewed about once an hour. Supabase cannot tell when a phone
    // app is on screen, so the app tells it when to renew and when to pause.
    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      data.subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}
