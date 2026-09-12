const MAX_BLOCKS = 12;
const MAX_BLOCK_TEXT_LENGTH = 4_000;
const MAX_LINK_LABEL_LENGTH = 160;
const MAX_HREF_LENGTH = 2_048;

const textBlockKinds = new Set(['paragraph', 'text', 'rich-text']);
const supportedBlockKinds = new Set(['paragraph', 'text', 'rich-text', 'heading', 'quote', 'link']);

export type RenderableContentBlock =
  | { kind: 'text'; key: string; text: string }
  | { kind: 'heading'; key: string; level: 2 | 3; text: string }
  | { kind: 'quote'; key: string; text: string; cite?: string }
  | { kind: 'link'; key: string; label: string; href: string };

export interface RenderableContentBlocks {
  blocks: RenderableContentBlock[];
  unsupportedCount: number;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

export function safeSiteRelativeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > MAX_HREF_LENGTH ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    containsControlCharacter(candidate)
  ) {
    return null;
  }

  const rawPath = candidate.split(/[?#]/, 1)[0] ?? '';
  const rawSegments = rawPath.split('/');
  if (
    rawSegments.some((segment) => segment === '.' || segment === '..') ||
    /%(?:2e|2f|5c)/i.test(rawPath)
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, 'https://nova.invalid');
    if (url.origin !== 'https://nova.invalid' || url.username || url.password) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function blockText(payload: unknown, maxLength = MAX_BLOCK_TEXT_LENGTH): string | null {
  if (typeof payload === 'string') return boundedText(payload, maxLength);
  return boundedText(recordValue(payload)?.text, maxLength);
}

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
