export function validateInventoryAdjustment(delta: string, reason: string): string[] {
  const issues: string[] = [];
  const numericDelta = Number(delta);
  if (!Number.isSafeInteger(numericDelta) || numericDelta === 0) {
    issues.push('مقدار تغییر باید عدد صحیح غیرصفر باشد.');
  }
  if (!reason.trim()) issues.push('دلیل تغییر موجودی را وارد کنید.');
  if (reason.trim().length > 500) issues.push('دلیل تغییر موجودی نباید بیشتر از ۵۰۰ نویسه باشد.');
  return issues;
}
