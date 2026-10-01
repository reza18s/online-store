import { useEffect, useState } from 'react';

import { Button } from '@nova/ui';

import { completeLocalPayment } from '@/features/checkout/api/checkout-api';

import { navigateToRoute } from '@/app/routing/route';

import { Icon } from '@/shared/ui/icon';

import { CheckoutShell } from '@/features/checkout/components/checkout-shell';

export function LocalPaymentPage({ queryString = '' }: { queryString?: string }) {
  const params = new URLSearchParams(queryString);
  const orderNumber = params.get('orderNumber') ?? '';
  const amountValue = params.get('amountToman') ?? '';
  const transactionId = params.get('transactionId') ?? '';
  const token = params.get('token') ?? '';
  const amountToman = Number(amountValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      !orderNumber ||
      !transactionId ||
      !token ||
      !Number.isSafeInteger(amountToman) ||
      amountToman < 1
    ) {
      setError('لینک پرداخت محلی کامل نیست؛ سفارش شما تغییر نکرده است.');
      return;
    }

    let active = true;
    void completeLocalPayment({ orderNumber, amountToman, transactionId, token })
      .then((result) => {
        if (!active) return;
        if (result.outcome === 'PAID' || result.outcome === 'DUPLICATE') {
          navigateToRoute(`/checkout/confirmation?orderNumber=${encodeURIComponent(orderNumber)}`);
          return;
        }
        setError('پرداخت محلی تأیید نشد؛ وضعیت سفارش خود را بررسی کنید.');
      })
      .catch(() => {
        if (active) setError('تکمیل پرداخت محلی ممکن نشد؛ دوباره تلاش کنید.');
      });

    return () => {
      active = false;
    };
  }, [amountToman, orderNumber, token, transactionId]);

  return (
    <CheckoutShell>
      <section
        className="checkout-state-card"
        role={error ? 'alert' : 'status'}
      >
        <Icon name={error ? 'warning' : 'shield'} size={24} />
        <h1>{error ? 'پرداخت انجام نشد' : 'در حال تکمیل پرداخت محلی'}</h1>
        <p>
          {error || 'پرداخت آزمایشی بدون اتصال به درگاه خارجی در حال ثبت است.'}
        </p>
        {error ? (
          <Button className="mt-5" asChild variant="outline">
            <a href={`/checkout/payment-recovery?orderNumber=${encodeURIComponent(orderNumber)}`}>
              بررسی وضعیت سفارش
            </a>
          </Button>
        ) : null}
      </section>
    </CheckoutShell>
  );
}
