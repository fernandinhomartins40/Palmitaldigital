import { lazy, type ComponentType } from 'react';

/**
 * Wraps React.lazy so that a failed dynamic import (typically caused by a new
 * deploy invalidating the previously-hashed chunk) triggers a one-time full
 * page reload to fetch the fresh asset manifest, instead of dumping the user
 * on the error boundary. A sessionStorage flag prevents reload loops.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const flagKey = 'chunk-reload-attempted';
    try {
      const mod = await importer();
      window.sessionStorage.removeItem(flagKey);
      return mod;
    } catch (error) {
      const alreadyTried = window.sessionStorage.getItem(flagKey);
      if (!alreadyTried) {
        window.sessionStorage.setItem(flagKey, '1');
        window.location.reload();
        // Return a never-resolving promise so nothing renders before reload.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
