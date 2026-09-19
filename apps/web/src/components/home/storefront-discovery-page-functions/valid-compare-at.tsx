export function validCompareAt(price: number, compareAt: number | null | undefined): number | null {
  return compareAt !== null && compareAt !== undefined && compareAt > price ? compareAt : null;
}
