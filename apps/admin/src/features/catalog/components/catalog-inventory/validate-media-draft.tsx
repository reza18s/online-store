export function validateMediaDraft(url: string, altText: string): string[] {
  const issues: string[] = [];
  if (!url.trim()) issues.push('نشانی رسانه را وارد کنید.');
  if (!altText.trim()) issues.push('متن جایگزین رسانه را وارد کنید.');
  return issues;
}
