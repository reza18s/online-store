export function shouldShowCatalogRefreshNotice(isError: boolean, hasData: boolean): boolean {
  return isError && hasData;
}
