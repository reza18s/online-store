import { useState, type FormEvent } from 'react';
import { Button, Input as UiInput } from '@nova/ui';

import { useStaffLogin } from '../../lib/admin/admin-catalog-api';

import { Icon } from '../ui/icon';

import { Logo } from '../ui/site-shell';

import type { StaffLoginValidation } from '../app/app-shared';

import { staffLoginErrorMessage } from '../auth/staff-login-error-message';

import { validateStaffLoginInput } from '../../utils/app/validate-staff-login-input';

export function AdminLoginPage({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const loginMutation = useStaffLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [factor, setFactor] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState<StaffLoginValidation | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const validation = validateStaffLoginInput(email, password, factor);
    if (validation) {
      setFieldError(validation);
      document.getElementById(`staff-${validation.field}`)?.focus();
      return;
    }
    setFieldError(null);
    loginMutation.mutate(
      { email, password, factor },
      {
        onSuccess: () => {
          window.location.hash = '#admin';
        },
        onError: (error) => setFormError(staffLoginErrorMessage(error)),
      },
    );
  };

  return (
    <main className="admin-login-page bg-background px-4 py-6 md:px-8 md:py-10" dir="rtl">
      <div className="admin-login-shell">
        <aside className="admin-login-visual" aria-label="روایت برند نوا">
          <img src="/assets/nova-women-lifestyle.webp" alt="" />
          <div className="admin-login-visual__veil" />
          <div className="admin-login-visual__copy">
            <Logo descriptor="ATELIER EDITORIAL" />
            <p>جزئیات، هویت برند ماست.</p>
            <span>PEOPLE · FASHION · DETAILS</span>
          </div>
          <small>مدیریت دنیای نوا از زیبایی</small>
        </aside>
        <section className="admin-login-form border border-border bg-surface p-7 text-right shadow-none md:p-10">
          <div className="admin-login-form__mark" aria-hidden="true">
            <Icon name="shield" size={22} />
          </div>
          <span className="section-heading__eyebrow mt-7 block">NOVA / ADMIN ACCESS</span>
          <h1 className="mt-4 text-3xl leading-relaxed">ورود به فضای مدیریت</h1>
          <p className="mt-3 max-w-[360px] text-sm leading-8 text-muted-foreground">
            برای ادامه، رمز عبور و کد تأیید دومرحله‌ای مدیر را وارد کنید.
          </p>
          {sessionExpired ? (
            <p
              className="mt-6 flex items-start gap-2 border border-error/20 bg-error-soft px-3 py-3 text-sm leading-7 text-error"
              role="status"
            >
              <Icon name="warning" size={17} className="mt-1 shrink-0" />
              نشست مدیریت منقضی شده است؛ برای ادامه دوباره وارد شوید.
            </p>
          ) : null}
          <form className="mt-7 flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-email">
              <span>ایمیل سازمانی</span>
              <span className="relative block">
                <UiInput
                  id="staff-email"
                  className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'email' ? 'border-destructive' : 'border-border'}`}
                  dir="ltr"
                  name="email"
                  autoComplete="username"
                  required
                  type="email"
                  value={email}
                  aria-describedby={fieldError?.field === 'email' ? 'staff-email-error' : undefined}
                  aria-invalid={fieldError?.field === 'email' ? 'true' : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldError?.field === 'email') setFieldError(null);
                  }}
                  placeholder="admin@example.com"
                />
                <Icon
                  name="mail"
                  size={18}
                  className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </span>
              {fieldError?.field === 'email' ? (
                <span
                  id="staff-email-error"
                  className="flex items-start gap-1 text-sm leading-6 text-destructive"
                  role="alert"
                >
                  <Icon name="warning" size={16} className="mt-1 shrink-0" />
                  {fieldError.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-password">
              <span>رمز عبور</span>
              <span className="relative block">
                <UiInput
                  id="staff-password"
                  className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'password' ? 'border-destructive' : 'border-border'}`}
                  dir="ltr"
                  name="password"
                  autoComplete="current-password"
                  required
                  type="password"
                  value={password}
                  aria-describedby={
                    fieldError?.field === 'password' ? 'staff-password-error' : undefined
                  }
                  aria-invalid={fieldError?.field === 'password' ? 'true' : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldError?.field === 'password') setFieldError(null);
                  }}
                />
                <Icon
                  name="eye"
                  size={18}
                  className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </span>
              {fieldError?.field === 'password' ? (
                <span
                  id="staff-password-error"
                  className="flex items-start gap-1 text-sm leading-6 text-destructive"
                  role="alert"
                >
                  <Icon name="warning" size={16} className="mt-1 shrink-0" />
                  {fieldError.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-factor">
              <span>کد تأیید دومرحله‌ای یا کد بازیابی</span>
              <span className="relative block">
                <UiInput
                  id="staff-factor"
                  className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'factor' ? 'border-destructive' : 'border-border'}`}
                  dir="ltr"
                  name="factor"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  type="text"
                  value={factor}
                  aria-describedby={
                    fieldError?.field === 'factor' ? 'staff-factor-error' : undefined
                  }
                  aria-invalid={fieldError?.field === 'factor' ? 'true' : undefined}
                  onChange={(event) => {
                    setFactor(event.target.value);
                    if (fieldError?.field === 'factor') setFieldError(null);
                  }}
                />
                <Icon
                  name="shield"
                  size={18}
                  className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </span>
              {fieldError?.field === 'factor' ? (
                <span
                  id="staff-factor-error"
                  className="flex items-start gap-1 text-sm leading-6 text-destructive"
                  role="alert"
                >
                  <Icon name="warning" size={16} className="mt-1 shrink-0" />
                  {fieldError.message}
                </span>
              ) : null}
            </label>
            {formError ? (
              <p
                className="flex items-start gap-2 border border-error/20 bg-error-soft px-3 py-2 text-sm leading-7 text-error"
                role="alert"
                aria-live="polite"
              >
                <Icon name="warning" size={17} className="mt-1 shrink-0" />
                {formError}
              </p>
            ) : null}
            <Button
              className="w-full !rounded-control"
              size="lg"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'در حال بررسی...' : 'ورود به پنل'}
              <Icon name="arrow-right" size={17} />
            </Button>
          </form>
          <div className="admin-login-form__security mt-6">
            <Icon name="shield" size={17} />
            <div>
              <strong>دسترسی امن و رمزگذاری‌شده</strong>
              <span>اطلاعات شما با بالاترین سطح امنیت محافظت می‌شود.</span>
            </div>
          </div>
          <a
            className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground transition-colors hover:text-primary"
            href="#home"
          >
            بازگشت به فروشگاه <Icon name="arrow-right" size={15} />
          </a>
        </section>
      </div>
    </main>
  );
}
