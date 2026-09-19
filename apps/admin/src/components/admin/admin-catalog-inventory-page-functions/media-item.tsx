import { useState } from 'react';

import { Button, Input as UiInput } from '@nova/ui';
import type {
  useDeleteAdminProductMedia,
  useUpdateAdminProductMedia,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { statusLabel } from './status-label';

export function MediaItem({
  media,
  productId,
  canWrite,
  updateMedia,
  deleteMedia,
}: {
  media: { id: string; url: string; altText: string; kind: string };
  productId: string;
  canWrite: boolean;
  updateMedia: ReturnType<typeof useUpdateAdminProductMedia>;
  deleteMedia: ReturnType<typeof useDeleteAdminProductMedia>;
}) {
  const [altText, setAltText] = useState(media.altText);
  return (
    <div className="flex items-center gap-3 py-3">
      <img
        className="h-12 w-12 shrink-0 rounded-control border border-border object-cover"
        src={media.url}
        alt={media.altText}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs" dir="ltr">
          {media.url}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{statusLabel(media.kind)}</p>
        <UiInput
          aria-label={`متن جایگزین ${media.url}`}
          className="mt-2 min-h-9 w-full border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setAltText(event.target.value)}
          value={altText}
        />
      </div>
      {canWrite ? (
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label="ذخیره متن جایگزین"
            loading={updateMedia.isPending}
            onClick={() =>
              void updateMedia.mutateAsync({
                productId,
                mediaId: media.id,
                input: { altText: altText.trim() },
              })
            }
            size="icon"
            variant="outline"
          >
            <Icon name="check" size={14} />
          </Button>
          <Button
            aria-label="حذف رسانه"
            disabled={deleteMedia.isPending}
            onClick={() => void deleteMedia.mutateAsync({ productId, mediaId: media.id })}
            size="icon"
            variant="ghost"
          >
            <Icon name="close" size={14} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
