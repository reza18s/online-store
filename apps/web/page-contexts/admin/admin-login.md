# Page Context

## Page

**Path:** `src/features/auth/components/AdminLoginPage.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Input as UiInput } from '@nova/ui';

import { useStaffLogin } from '@/features/auth/api/use-staff-login';

import { Icon } from '@/shared/ui/icon';

import { Logo } from '@/shared/ui/site-shell';

import type { StaffLoginValidation } from '@/features/auth/types';

import { staffLoginErrorMessage } from '@/features/auth/components/staff-login-error-message';

import { validateStaffLoginInput } from '@/shared/utils/validate-staff-login-input';

import { navigateToRoute } from '@/app/routing/navigate-to-route';

import '@/styles/admin-reference.css';

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
          navigateToRoute('/admin');
        },
        onError: (error) => setFormError(staffLoginErrorMessage(error)),
      },
    );
  };

  return (
    <main className="admin-login-page admin-reference-login bg-background px-4 py-6 md:px-8 md:py-10" dir="rtl">
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
            href="/"
          >
            بازگشت به فروشگاه <Icon name="arrow-right" size={15} />
          </a>
        </section>
      </div>
    </main>
  );
}

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 3. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


### 4. Logo

**Path:** `src/shared/ui/logo.tsx`

```tsx
export function Logo({ descriptor = 'ATELIER EDITORIAL' }: { descriptor?: string } = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href="/admin"
      aria-label="NOVA، داشبورد مدیریت"
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}

```

---


## Summary

- Page: `src/features/auth/components/AdminLoginPage.tsx`
- Custom component files: 4
- Total files included: 5
