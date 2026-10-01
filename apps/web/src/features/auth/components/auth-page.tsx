import { useState, type FormEvent } from 'react';
import { Button, Input as UiInput } from '@nova/ui';

import { useRequestCustomerOtp, useVerifyCustomerOtp } from '@/features/auth/api/auth-api';
import { Icon } from '@/shared/ui/icon';

import { authErrorMessage } from '@/features/auth/components/auth-error-message';

import { clearAuthPhone } from '@/features/auth/state/clear-auth-phone';

import { readAuthPhone } from '@/features/auth/state/read-auth-phone';

import { writeAuthPhone } from '@/features/auth/state/write-auth-phone';

import { navigateToRoute } from '@/app/routing/route';

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
        navigateToRoute('/account');
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
      navigateToRoute(`/auth/verify?${nextParams.toString()}`);
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
      navigateToRoute(`/auth/verify?${nextParams.toString()}`);
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <main className="shell auth-page">
      <section className="auth-shell">
        <aside className="auth-visual" aria-label="NOVA Atelier Editorial">
          <img src="/assets/nova-women-lifestyle.webp" alt="استایل زنانه نوا" />
          <span className="auth-visual__veil" aria-hidden="true" />
          <div className="auth-visual__copy">
            <span>NOVA / ATELIER EDITORIAL</span>
            <strong>
              زیبایی،
              <br />
              از انتخاب‌های آگاهانه آغاز می‌شود.
            </strong>
            <small>TIMELESS · PERSIAN · ALWAYS YOU</small>
          </div>
        </aside>

        <section className="auth-form-panel">
          <span className="auth-form-panel__mark" aria-hidden="true">
            <Icon name={isVerify ? 'check' : 'user'} size={22} />
          </span>
          <span className="section-heading__eyebrow">
            NOVA / {isVerify ? 'OTP VERIFY' : 'SIGN IN'}
          </span>
          <h1>{isVerify ? 'کد ورود را وارد کنید' : 'به نوا خوش آمدید'}</h1>
          <p>
            {isVerify
              ? 'کد شش‌رقمی ارسال‌شده به شماره شما را وارد کنید. کد تا ۵ دقیقه معتبر است.'
              : 'برای ورود یا ساخت حساب، شماره موبایل خود را وارد کنید تا کد یکبار مصرف برای شما ارسال شود.'}
          </p>
          <form className="auth-form" onSubmit={(event) => void submitForm(event)}>
            <label>
              <span>{isVerify ? 'کد تأیید' : 'شماره موبایل'}</span>
              <UiInput
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
            <Button disabled={isSubmitting || (isVerify && !challengeId)} size="lg" type="submit">
              {isVerify
                ? verifyOtpMutation.isPending
                  ? 'در حال بررسی...'
                  : 'تأیید و ورود'
                : requestOtpMutation.isPending
                  ? 'در حال ارسال...'
                  : 'ارسال کد ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          </form>
          <div className="auth-form-panel__links">
            <a className="text-link" href={isVerify ? '/auth' : '/'}>
              {isVerify ? 'تغییر شماره' : 'بازگشت به فروشگاه'} <Icon name="arrow-left" size={14} />
            </a>
            {isVerify ? (
              <Button
                className="auth-resend"
                disabled={isSubmitting}
                onClick={() => void resendCode()}
                type="button"
              >
                {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال دوباره کد'}
              </Button>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
