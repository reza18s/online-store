import { MAX_BLOCK_TEXT_LENGTH } from '@/features/content/api/content-blocks-shared';

import { boundedText } from '@/features/content/api/bounded-text';

import { recordValue } from '@/features/content/api/record-value';

export function blockText(payload: unknown, maxLength = MAX_BLOCK_TEXT_LENGTH): string | null {
  if (typeof payload === 'string') return boundedText(payload, maxLength);
  return boundedText(recordValue(payload)?.text, maxLength);
}
