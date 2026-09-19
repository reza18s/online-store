import { useState, type FormEvent } from 'react';
import { Button, Input as UiInput } from '@nova/ui';

import { useRequestCustomerOtp, useVerifyCustomerOtp } from '../../lib/auth/auth-api';
import { Icon } from '../ui/icon';

import { authErrorMessage } from './auth-error-message';

import { clearAuthPhone } from '../../utils/app/clear-auth-phone';

import { readAuthPhone } from '../../utils/app/read-auth-phone';

import { writeAuthPhone } from '../../utils/app/write-auth-phone';

export function AuthPage({
  mode,
  queryString = '',
}: {
  mode: 'request' | 'verify';
  queryString?: string;
}) {
  const isVerify = mode === 'verify';
  const requestOtpMutation = useRequestCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();
  const [phone, setPhone] = useState(() => (isVerify ? readAuthPhone() : ''));
  const [code, setCode] = useState('');
  const localCode = new URLSearchParams(queryString).get('localCode') ?? '';
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const challengeId = new URLSearchParams(queryString).get('challengeId') ?? '';
  const isSubmitting = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (isVerify) {
      if (!challengeId) {
        setFormError('نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.');
        return;
      }
      if (!code.trim()) {
        setFormError('کد تأیید را وارد کنید.');
        return;
      }

      try {
        await verifyOtpMutation.mutateAsync({ challengeId, code: code.trim() });
        clearAuthPhone();
        window.location.hash = '#account';
      } catch (error) {
        setFormError(authErrorMessage(error));
      }
      return;
    }

    if (!phone.trim()) {
      setFormError('شماره موبایل را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: phone.trim() });
      writeAuthPhone(phone.trim());
      const nextParams = new URLSearchParams({ challengeId: result.challengeId });
      if (result.localCode) nextParams.set('localCode', result.localCode);
      window.location.hash = `#auth/verify?${nextParams.toString()}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  const resendCode = async () => {
    const storedPhone = phone.trim() || readAuthPhone();
    setFormError('');
    setSuccessMessage('');
    if (!storedPhone) {
      setFormError('شماره موبایل پیدا نشد؛ ابتدا شماره را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: storedPhone });
      writeAuthPhone(storedPhone);
      setSuccessMessage('کد جدید ارسال شد.');
      const nextParams = new URLSearchParams({ challengeId: result.challengeId });
      if (result.localCode) nextParams.set('localCode', result.localCode);
      window.location.hash = `#auth/verify?${nextParams.toString()}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-xl border border-border bg-surface px-6 py-12 text-center shadow-card md:px-12">
        <span className="section-heading__eyebrow">
          NOVA / {isVerify ? 'OTP VERIFY' : 'SIGN IN'}
        </span>
        <span className="mx-auto mb-5 mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={isVerify ? 'check' : 'user'} size={24} />
        </span>
        <h1 className="text-3xl leading-relaxed">
          {isVerify ? 'کد ورود را وارد کنید' : 'به نوا خوش آمدید'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-8 text-muted-foreground">
          {isVerify
            ? 'کد شش‌رقمی ارسال‌شده به شماره شما را وارد کنید. کد تا ۵ دقیقه معتبر است.'
            : 'برای ورود یا ساخت حساب، شماره موبایل خود را وارد کنید تا کد یکبار مصرف برای شما ارسال شود.'}
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md flex-col gap-4 text-right"
          onSubmit={(event) => void submitForm(event)}
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            {isVerify ? 'کد تأیید' : 'شماره موبایل'}
            <UiInput
              className="min-h-12 border border-border bg-background px-4 text-center outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              inputMode={isVerify ? 'numeric' : 'tel'}
              maxLength={isVerify ? 6 : undefined}
              placeholder={isVerify ? '۱۲۳۴۵۶' : '۰۹۱۲ ۱۲۳ ۴۵۶۷'}
              required
              type={isVerify ? 'text' : 'tel'}
              value={isVerify ? code : phone}
              onChange={(event) =>
                isVerify ? setCode(event.target.value) : setPhone(event.target.value)
              }
              autoComplete={isVerify ? 'one-time-code' : 'tel'}
              aria-invalid={formError ? 'true' : undefined}
            />
          </label>
          {successMessage ? (
            <div className="inline-message inline-message--success" role="status">
              <Icon name="check" size={16} />
              {successMessage}
            </div>
          ) : null}
          {isVerify && localCode ? (
            <div className="inline-message inline-message--success" role="status">
              <Icon name="check" size={16} />
              کد تست محلی:{' '}
              <strong dir="ltr" className="font-mono tracking-[0.2em]">
                {localCode}
              </strong>
            </div>
          ) : null}
          {formError ||
          (isVerify && !challengeId ? 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.' : '') ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {formError || 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.'}
            </div>
          ) : null}
          {isVerify ? (
            <Button disabled={isSubmitting || !challengeId} size="lg" type="submit">
              {verifyOtpMutation.isPending ? 'در حال بررسی...' : 'تأیید و ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          ) : (
            <Button disabled={isSubmitting} size="lg" type="submit">
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال کد ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          )}
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <a className="text-link" href={isVerify ? '#auth' : '#home'}>
            {isVerify ? 'تغییر شماره' : 'بازگشت به فروشگاه'} <Icon name="arrow-left" size={14} />
          </a>
          {isVerify ? (
            <Button
              className="min-h-11 text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void resendCode()}
              type="button"
            >
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال دوباره کد'}
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
