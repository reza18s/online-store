const RECENT_SEARCHES_KEY = 'nova.recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]',
    ) as unknown;
    return Array.isArray(saved)
      ? saved
          .filter((item): item is string => typeof item === 'string')
          .slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentSearch(
  term: string,
  existing: readonly string[] = readRecentSearches(),
): string[] {
  const normalized = term.trim();
  if (!normalized) return [...existing].slice(0, MAX_RECENT_SEARCHES);

  const next = [normalized, ...existing.filter((item) => item !== normalized)].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Recent search history is an enhancement; private browsing may reject storage.
    }
  }

  return next;
}
