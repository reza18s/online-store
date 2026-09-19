import { Icon } from '../../ui/icon';

export function MediaThumb({ src, alt }: { src?: string | null; alt: string }) {
  return src ? (
    <img
      className="h-12 w-12 shrink-0 rounded-control border border-border bg-secondary object-cover"
      src={src}
      alt={alt}
    />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-secondary text-muted-foreground">
      <Icon name="bag" size={19} />
    </span>
  );
}
