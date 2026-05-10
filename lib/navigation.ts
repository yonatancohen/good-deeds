import type { Router } from 'expo-router';

/**
 * Safe back navigation for web: if there's no history (e.g. hard refresh directly
 * to an inner screen), fall back to the given route instead of crashing with
 * "GO_BACK was not handled by any navigator".
 */
export function safeBack(router: Router, fallback: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
