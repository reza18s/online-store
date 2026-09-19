import { formatNumber } from './format-number';

export function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}
