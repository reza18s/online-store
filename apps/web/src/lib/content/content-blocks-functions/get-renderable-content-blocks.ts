import type { RenderableContentBlock, RenderableContentBlocks } from '../content-blocks-shared';
import {
  MAX_BLOCKS,
  MAX_LINK_LABEL_LENGTH,
  supportedBlockKinds,
  textBlockKinds,
} from '../content-blocks-shared';

import { blockText } from './block-text';

import { boundedText } from './bounded-text';

import { recordValue } from './record-value';

import { safeSiteRelativeHref } from './safe-site-relative-href';

export function getRenderableContentBlocks(blocks: unknown): RenderableContentBlocks {
  if (!Array.isArray(blocks)) return { blocks: [], unsupportedCount: 1 };

  const boundedBlocks = blocks.slice(0, MAX_BLOCKS);
  const renderable: Array<{ block: RenderableContentBlock; index: number; sortOrder: number }> = [];
  let unsupportedCount = Math.max(0, blocks.length - boundedBlocks.length);

  boundedBlocks.forEach((candidate, index) => {
    const block = recordValue(candidate);
    const kind = typeof block?.kind === 'string' ? block.kind.trim().toLowerCase() : '';
    const sortOrder =
      typeof block?.sortOrder === 'number' && Number.isInteger(block.sortOrder)
        ? block.sortOrder
        : index;
    const payload = block?.payload;
    const key = `${kind || 'unsupported'}-${sortOrder}-${index}`;

    if (!supportedBlockKinds.has(kind)) {
      unsupportedCount += 1;
      return;
    }

    if (textBlockKinds.has(kind)) {
      const text = blockText(payload);
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind: 'text', key, text }, index, sortOrder });
      return;
    }

    if (kind === 'heading') {
      const payloadRecord = recordValue(payload);
      const text = blockText(payloadRecord?.text ?? payload);
      const level = payloadRecord?.level === 3 ? 3 : 2;
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind, key, level, text }, index, sortOrder });
      return;
    }

    if (kind === 'quote') {
      const payloadRecord = recordValue(payload);
      const text = blockText(payloadRecord?.text ?? payload);
      const cite = boundedText(payloadRecord?.cite, 160) ?? undefined;
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind, key, text, ...(cite ? { cite } : {}) }, index, sortOrder });
      return;
    }

    const payloadRecord = recordValue(payload);
    const label = boundedText(payloadRecord?.label, MAX_LINK_LABEL_LENGTH);
    const href = safeSiteRelativeHref(payloadRecord?.href);
    if (!label || !href) {
      unsupportedCount += 1;
      return;
    }
    renderable.push({ block: { kind: 'link', key, label, href }, index, sortOrder });
  });

  renderable.sort((left, right) => left.sortOrder - right.sortOrder || left.index - right.index);
  return { blocks: renderable.map(({ block }) => block), unsupportedCount };
}
