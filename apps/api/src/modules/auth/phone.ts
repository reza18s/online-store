import { BadRequestException } from '@nestjs/common';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeLocalizedDigits(value: string): string {
  return [...value]
    .map((character) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(character);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_DIGITS.indexOf(character);
      return arabicIndex >= 0 ? String(arabicIndex) : character;
    })
    .join('');
}

export function normalizeIranianPhone(input: string): string {
  const compact = normalizeLocalizedDigits(input.normalize('NFKC')).replace(/[\s()-]/g, '');
  if (compact.length > 20) throw new BadRequestException('شماره موبایل معتبر نیست.');

  if (/^09\d{9}$/.test(compact)) return `+98${compact.slice(1)}`;
  if (/^989\d{9}$/.test(compact)) return `+${compact}`;
  if (/^00989\d{9}$/.test(compact)) return `+${compact.slice(2)}`;
  if (/^\+989\d{9}$/.test(compact)) return compact;

  throw new BadRequestException('شماره موبایل معتبر نیست.');
}

export function normalizeOtpCode(input: string): string {
  const code = normalizeLocalizedDigits(input.normalize('NFKC')).replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) throw new BadRequestException('کد واردشده معتبر نیست.');
  return code;
}
