import type { StaffLoginValidation } from '../../components/app/app-shared';

export function validateStaffLoginInput(
  email: string,
  password: string,
  factor: string,
): StaffLoginValidation | null {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return { field: 'email', message: 'ایمیل سازمانی را وارد کنید.' };
  if (!/^[^\s@]+@[^\s@]+$/.test(normalizedEmail)) {
    return { field: 'email', message: 'لطفاً یک ایمیل معتبر وارد کنید.' };
  }
  if (!password.trim()) return { field: 'password', message: 'رمز عبور را وارد کنید.' };
  if (password.trim().length < 12) {
    return { field: 'password', message: 'رمز عبور باید حداقل ۱۲ کاراکتر باشد.' };
  }
  if (!factor.trim()) {
    return { field: 'factor', message: 'کد تأیید دومرحله‌ای یا کد بازیابی را وارد کنید.' };
  }
  if (factor.trim().length < 6) {
    return { field: 'factor', message: 'کد تأیید یا کد بازیابی باید حداقل ۶ کاراکتر باشد.' };
  }
  return null;
}
