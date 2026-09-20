import type { CatalogMediaContentType } from '@nova/api-client';

export const CATALOG_MEDIA_MAX_BYTES = 15 * 1024 * 1024;

const CATALOG_MEDIA_CONTENT_TYPES = new Set<CatalogMediaContentType>([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function validateCatalogMediaFile(file: File | null): string[] {
  if (!file) return ['یک فایل تصویر انتخاب کنید.'];
  const issues: string[] = [];
  if (!CATALOG_MEDIA_CONTENT_TYPES.has(file.type as CatalogMediaContentType)) {
    issues.push('فرمت تصویر باید AVIF، GIF، JPEG، PNG یا WebP باشد.');
  }
  if (file.size < 1 || file.size > CATALOG_MEDIA_MAX_BYTES) {
    issues.push('حجم تصویر باید حداکثر ۱۵ مگابایت باشد.');
  }
  return issues;
}

export function catalogMediaContentType(file: File): CatalogMediaContentType {
  return file.type as CatalogMediaContentType;
}

export async function readCatalogMediaDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Some browsers cannot decode every accepted format with createImageBitmap.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Image dimensions could not be read.'));
      element.src = objectUrl;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
