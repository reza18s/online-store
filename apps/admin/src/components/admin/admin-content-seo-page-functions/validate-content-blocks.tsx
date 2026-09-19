import { type AdminContentPageCreateInput } from '@nova/api-client';

import { MAX_BLOCKS, SAFE_BLOCK_KIND } from '../../../pages/admin/admin-content-seo-page-shared';

import { parseBoundedJson } from './parse-bounded-json';

export function validateContentBlocks(value: string): {
  blocks?: AdminContentPageCreateInput['blocks'];
  error?: string;
} {
  const parsed = parseBoundedJson(value, 'بلوک‌ها');
  if (parsed.error) return { error: parsed.error };
  if (parsed.value === null || parsed.value === undefined || parsed.value === '')
    return { blocks: [] };
  if (!Array.isArray(parsed.value)) return { error: 'بلوک‌ها باید یک آرایه JSON باشند.' };
  if (parsed.value.length > MAX_BLOCKS)
    return { error: `تعداد بلوک‌ها نمی‌تواند بیشتر از ${MAX_BLOCKS} باشد.` };

  const blocks: Array<{ kind: string; payload: unknown; sortOrder: number }> = [];
  for (const [index, item] of parsed.value.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: `بلوک ${index + 1} باید یک شیء باشد.` };
    }
    const candidate = item as Record<string, unknown>;
    const kind = typeof candidate.kind === 'string' ? candidate.kind.trim() : '';
    if (!SAFE_BLOCK_KIND.test(kind)) {
      return { error: `نوع بلوک ${index + 1} معتبر نیست.` };
    }
    if (!Object.prototype.hasOwnProperty.call(candidate, 'payload')) {
      return { error: `بلوک ${index + 1} باید payload داشته باشد.` };
    }
    const sortOrder = candidate.sortOrder === undefined ? index : candidate.sortOrder;
    if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return { error: `ترتیب بلوک ${index + 1} معتبر نیست.` };
    }
    blocks.push({ kind, payload: candidate.payload, sortOrder });
  }
  return { blocks };
}
