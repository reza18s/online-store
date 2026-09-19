import type { ContentPage } from '@nova/api-client';

import { contentTitles } from '../dev-store-fixtures-shared';

export function getFakeContentPage(slug: string): ContentPage {
  const normalized = slug.trim().toLowerCase();
  const title = contentTitles[normalized] ?? 'روایت نوا';
  return {
    slug: normalized,
    title,
    body: 'در نوا، هر انتخاب با دقت و برای زندگی روزمره طراحی می‌شود؛ از لمس پارچه تا تجربه‌ای که بعد از خرید با شما می‌ماند.',
    blocks: [
      { kind: 'heading', sortOrder: 0, payload: { text: 'یک انتخاب آرام برای هر روز', level: 2 } },
      {
        kind: 'paragraph',
        sortOrder: 1,
        payload: {
          text: 'پارچه‌های خوش‌دست، فرم‌های ماندگار و جزئیاتی که قرار نیست برای دیده‌شدن فریاد بزنند. مجموعه‌های نوا برای ترکیب‌شدن با زندگی واقعی ساخته شده‌اند.',
        },
      },
      {
        kind: 'quote',
        sortOrder: 2,
        payload: { text: 'سادگی وقتی ارزشمند است که با دقت ساخته شده باشد.', cite: 'آتلیه نوا' },
      },
      {
        kind: 'link',
        sortOrder: 3,
        payload: { label: 'مشاهده انتخاب‌های تازه', href: '/#products/new' },
      },
    ],
  };
}
