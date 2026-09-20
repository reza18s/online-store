import type { Audience } from '@/app/routing/route-shared';
import { audiencePattern } from '@/app/routing/route-shared';

export function audienceFromPath(path: string): Audience | undefined {
  return path.match(audiencePattern)?.[1] as Audience | undefined;
}
