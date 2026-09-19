export const MAX_BLOCKS = 12;

export const MAX_BLOCK_TEXT_LENGTH = 4_000;

export const MAX_LINK_LABEL_LENGTH = 160;

export const MAX_HREF_LENGTH = 2_048;

export const textBlockKinds = new Set(['paragraph', 'text', 'rich-text']);

export const supportedBlockKinds = new Set([
  'paragraph',
  'text',
  'rich-text',
  'heading',
  'quote',
  'link',
]);

export type RenderableContentBlock =
  | { kind: 'text'; key: string; text: string }
  | { kind: 'heading'; key: string; level: 2 | 3; text: string }
  | { kind: 'quote'; key: string; text: string; cite?: string }
  | { kind: 'link'; key: string; label: string; href: string };

export interface RenderableContentBlocks {
  blocks: RenderableContentBlock[];
  unsupportedCount: number;
}
