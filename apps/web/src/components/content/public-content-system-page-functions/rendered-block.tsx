import { Icon } from '../../ui/icon';

import { type RenderableContentBlock } from '../../../lib/content/content-blocks';

export function RenderedBlock({ block }: { block: RenderableContentBlock }) {
  switch (block.kind) {
    case 'text':
      return <p>{block.text}</p>;
    case 'heading':
      return block.level === 3 ? <h3>{block.text}</h3> : <h2>{block.text}</h2>;
    case 'quote':
      return (
        <blockquote className="border-e-2 border-primary pe-4 text-muted-foreground">
          <p>{block.text}</p>
          {block.cite ? <cite className="mt-2 block text-xs not-italic">{block.cite}</cite> : null}
        </blockquote>
      );
    case 'link':
      return (
        <p>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none motion-reduce:transition-none"
            href={block.href}
          >
            {block.label}
            <Icon name="arrow-left" size={16} aria-hidden="true" />
          </a>
        </p>
      );
  }
}
