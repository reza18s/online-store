export function formatPersianNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}
