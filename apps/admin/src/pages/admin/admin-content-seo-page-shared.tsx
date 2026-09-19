import { type SeoRedirectStatusCode } from '@nova/api-client';

export type AdminContentSeoView = 'content' | 'seo' | 'redirects';

export type AdminContentSeoState =
  'loading' | 'ready' | 'empty' | 'error' | 'offline' | 'expired' | 'permission';

export const MAX_BLOCKS = 12;

export const MAX_JSON_LENGTH = 12_000;

export const MAX_JSON_DEPTH = 5;

export const SAFE_BLOCK_KIND = /^[a-z][a-z0-9._-]{0,31}$/;

export const SAFE_SITE_PATH = /^\/(?!\/)[^\s<>\\:]*$/;

export const HTML_LIKE = /<\/?[a-z!/][^>]*>/i;

export const CONTENT_LIMIT = 10;

export const SEO_LIMIT = 10;

export const REDIRECT_LIMIT = 100;

export type ContentDraft = { slug: string; title: string; body: string; blocksJson: string };

export type SeoDraft = {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex: boolean;
  structuredDataJson: string;
};

export type RedirectDraft = { fromPath: string; toPath: string; statusCode: SeoRedirectStatusCode };

export type AdminContentSeoQueryState = {
  isPending?: boolean;
  isError?: boolean;
  error?: unknown;
  hasItems?: boolean;
};
