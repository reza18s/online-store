export function looksOffline(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return error instanceof TypeError && /fetch|network|connection/i.test(error.message);
}
