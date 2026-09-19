export function formatToman(value: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}
