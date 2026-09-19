import { MAX_BLOCK_TEXT_LENGTH } from '../content-blocks-shared';

import { boundedText } from './bounded-text';

import { recordValue } from './record-value';

export function blockText(payload: unknown, maxLength = MAX_BLOCK_TEXT_LENGTH): string | null {
  if (typeof payload === 'string') return boundedText(payload, maxLength);
  return boundedText(recordValue(payload)?.text, maxLength);
}
