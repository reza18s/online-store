import type { Audience } from '../hash-route-shared';
import { audiencePattern } from '../hash-route-shared';

export function audienceFromPath(path: string): Audience | undefined {
  return path.match(audiencePattern)?.[1] as Audience | undefined;
}
