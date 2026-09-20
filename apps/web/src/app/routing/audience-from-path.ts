import type { Audience } from '@/app/routing/hash-route-shared';
import { audiencePattern } from '@/app/routing/hash-route-shared';

export function audienceFromPath(path: string): Audience | undefined {
  return path.match(audiencePattern)?.[1] as Audience | undefined;
}
