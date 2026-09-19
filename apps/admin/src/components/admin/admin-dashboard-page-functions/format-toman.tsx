import { formatPersianNumber } from './format-persian-number';

export function formatToman(value: number): string {
  return `${formatPersianNumber(value)} تومان`;
}
