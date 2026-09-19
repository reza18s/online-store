import type { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

export function invalidateContentQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
}
