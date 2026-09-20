import { MAX_BLOCK_TEXT_LENGTH } from '@/features/content/domain/content-blocks/content-blocks-shared';

import { boundedText } from '@/features/content/domain/content-blocks/bounded-text';

import { recordValue } from '@/features/content/domain/content-blocks/record-value';

export function blockText(payload: unknown, maxLength = MAX_BLOCK_TEXT_LENGTH): string | null {
  if (typeof payload === 'string') return boundedText(payload, maxLength);
  return boundedText(recordValue(payload)?.text, maxLength);
}
