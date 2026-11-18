import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { type Day, toDay } from './dates';

/**
 * Today's date, for the date rules on screen. It is read again each time the app
 * comes back to the screen, so a pill that said "Tomorrow" last night says "Today"
 * in the morning, even when nothing in the kitchen changed.
 */
export function useToday(): Day {
  const [today, setToday] = useState(() => toDay(new Date()));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      // The same day again is the same text, so React skips the re-render.
      if (status === 'active') {
        setToday(toDay(new Date()));
      }
    });
    return () => subscription.remove();
  }, []);

  return today;
}
