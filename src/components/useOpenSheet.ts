import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

/** The routes that are shown as sheets (src/app/_layout.tsx). */
type SheetPath = '/add-food' | '/settings';

/**
 * Returns a function that opens a sheet once. `router.push` adds a new screen on every
 * call, so tapping a + or the gear several times while the sheet is still sliding up
 * stacked several sheets on top of each other, and the stack broke.
 *
 * Two things stop a second push: the path is already the sheet's, or a push has just
 * been made and the screen has not caught up yet. A tap can arrive before the screen
 * has drawn the new path, because the sheet's first draw keeps the JavaScript thread
 * busy, so the path alone is not enough. The lock is lifted when the path changes,
 * which happens both when the sheet opens and when it is closed.
 */
export function useOpenSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const pushed = useRef(false);

  useEffect(() => {
    pushed.current = false;
  }, [pathname]);

  return useCallback(
    (path: SheetPath) => {
      if (pushed.current || pathname === path) {
        return;
      }
      pushed.current = true;
      router.push(path);
    },
    [pathname, router],
  );
}
