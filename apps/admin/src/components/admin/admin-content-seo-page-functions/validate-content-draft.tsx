import {
  type AdminContentPageCreateInput,
  type AdminContentPageUpdateInput,
} from '@nova/api-client';

import type { ContentDraft } from '../../../pages/admin/admin-content-seo-page-shared';
import { HTML_LIKE } from '../../../pages/admin/admin-content-seo-page-shared';

import { validateContentBlocks } from './validate-content-blocks';

export function validateContentDraft(
  draft: ContentDraft,
  options: { requireUsableContent?: boolean } = {},
): { input?: AdminContentPageCreateInput; update?: AdminContentPageUpdateInput; error?: string } {
  const slug = draft.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return {
      error:
        'اسلاگ باید فقط شامل حروف انگلیسی کوچک، عدد و خط تیره باشد و حداکثر ۱۲۰ نویسه داشته باشد.',
    };
  }
  const title = draft.title.trim();
  if (!title) return { error: 'عنوان صفحه را وارد کنید.' };
  if (title.length > 200) return { error: 'عنوان صفحه نباید بیشتر از ۲۰۰ نویسه باشد.' };
  if (HTML_LIKE.test(draft.body)) return { error: 'متن صفحه نباید شامل HTML باشد.' };
  const parsedBlocks = validateContentBlocks(draft.blocksJson);
  if (parsedBlocks.error || !parsedBlocks.blocks)
    return { error: parsedBlocks.error ?? 'بلوک‌ها معتبر نیستند.' };
  const body = draft.body.trim();
  if (options.requireUsableContent && !body && parsedBlocks.blocks.length === 0) {
    return { error: 'پیش از انتشار، حداقل یک متن یا بلوک محتوایی اضافه کنید.' };
  }
  const input = { slug, title, body: body || null, blocks: parsedBlocks.blocks };
  return { input, update: { title, body: body || null, blocks: parsedBlocks.blocks } };
}
