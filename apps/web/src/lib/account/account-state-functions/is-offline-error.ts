export function isOfflineError(error: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.onLine === false) || error instanceof TypeError
  );
}
