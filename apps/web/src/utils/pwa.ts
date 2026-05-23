export function isPwaDisplayMode() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function shouldUsePwaShell(pathname?: string) {
  const currentPath = pathname ?? (typeof window === 'undefined' ? '' : window.location.pathname);
  return currentPath.startsWith('/app') || isPwaDisplayMode();
}

export function getLoginPath(pathname?: string) {
  return shouldUsePwaShell(pathname) ? '/app/login' : '/login';
}
