import { useEffect, useRef, useState } from 'react';

import type { CatalogSearchSuggestion } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';

import { useCatalogSuggestions } from '../../lib/catalog/catalog-api';
import { Icon } from './icon';
import { useDialogFocus } from './use-dialog-focus';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDialogKeyDown = useDialogFocus(open, dialogRef, inputRef);
  const suggestionQuery = useCatalogSuggestions(debouncedQuery, open);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const nextQuery = query.trim();
    const timeout = window.setTimeout(() => setDebouncedQuery(nextQuery), 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem('nova.recent-searches') ?? '[]',
      ) as unknown;
      if (Array.isArray(saved))
        setRecent(saved.filter((item): item is string => typeof item === 'string').slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

  const rememberSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem('nova.recent-searches', JSON.stringify(next));
    } catch {
      // Local search history is an enhancement; private browsing may reject storage.
    }
  };

  const submitSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    rememberSearch(normalized);
    window.location.hash = `products?q=${encodeURIComponent(normalized)}`;
    onClose();
  };

  const openSuggestion = (suggestion: CatalogSearchSuggestion) => {
    rememberSearch(normalizedQuery);
    const destination =
      suggestion.type === 'CATEGORY'
        ? `products?category=${encodeURIComponent(suggestion.slug)}`
        : `product/${encodeURIComponent(suggestion.slug)}`;
    window.location.hash = destination;
    onClose();
  };

  if (!open) return null;
  const suggestions = suggestionQuery.data ?? [];
  const isSearching = Boolean(normalizedQuery);
  const isWaitingForDebounce = isSearching && debouncedQuery !== normalizedQuery;
  const isSuggestionPending = isSearching && (isWaitingForDebounce || suggestionQuery.isPending);
  return (
    <div
      className="modal-layer fixed inset-0 z-[500] flex items-start justify-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="search-dialog w-full max-w-3xl bg-surface shadow-float"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
            return;
          }
          handleDialogKeyDown(event);
        }}
      >
        <div className="search-dialog__top">
          <div>
            <span className="section-heading__eyebrow">NOVA / SEARCH</span>
            <h2 id="search-title">چه چیزی پیدا می‌کنید؟</h2>
          </div>
          <Button className="icon-button" type="button" onClick={onClose} aria-label="بستن جست‌وجو">
            <Icon name="close" />
          </Button>
        </div>
        <form
          className="search-field"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(query);
          }}
        >
          <Icon name="search" size={19} />
          <UiInput
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی محصول، دسته یا کالکشن"
            aria-label="جست‌وجوی محصول، دسته یا کالکشن"
          />
        </form>
        <div className="search-dialog__results" aria-live="polite">
          <span className="section-heading__eyebrow">
            {normalizedQuery ? 'نتایج جست‌وجو' : 'پیشنهادهای نوا'}
          </span>
          {isSuggestionPending ? (
            <p className="search-empty">در حال جست‌وجو...</p>
          ) : suggestionQuery.isError ? (
            <div
              className="flex items-center justify-between gap-3 py-4 text-sm text-warning"
              role="alert"
            >
              <span>جست‌وجو در دسترس نیست.</span>
              <Button
                className="text-primary underline"
                type="button"
                onClick={() => void suggestionQuery.refetch()}
              >
                تلاش دوباره
              </Button>
            </div>
          ) : suggestions.length ? (
            suggestions.map((suggestion) => (
              <a
                href={
                  suggestion.type === 'CATEGORY'
                    ? `#products?category=${encodeURIComponent(suggestion.slug)}`
                    : `#product/${encodeURIComponent(suggestion.slug)}`
                }
                key={`${suggestion.type}:${suggestion.id}`}
                onClick={() => openSuggestion(suggestion)}
              >
                {suggestion.imageUrl ? (
                  <img src={suggestion.imageUrl} alt={suggestion.imageAlt ?? ''} />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center bg-secondary text-muted-foreground">
                    <Icon name={suggestion.type === 'CATEGORY' ? 'layers' : 'shirt'} size={19} />
                  </span>
                )}
                <span>
                  <strong>{suggestion.label}</strong>
                  <small>{suggestion.type === 'CATEGORY' ? 'دسته‌بندی' : 'محصول'}</small>
                </span>
                <Icon name="arrow-left" size={16} />
              </a>
            ))
          ) : normalizedQuery ? (
            <p className="search-empty">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</p>
          ) : (
            <p className="search-empty">برای شروع، نام محصول یا دسته را وارد کنید.</p>
          )}
          {!query.trim() && recent.length ? (
            <div className="mt-5 border-t border-border pt-4">
              <span className="section-heading__eyebrow">جست‌وجوهای اخیر</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((item) => (
                  <Button
                    className="border border-border bg-surface px-3 py-2 text-xs hover:border-primary hover:text-primary"
                    type="button"
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      submitSearch(item);
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
