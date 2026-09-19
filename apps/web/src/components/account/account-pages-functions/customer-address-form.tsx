import { useEffect, useState, type FormEvent } from 'react';
import { type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';
import { Button, Checkbox, Textarea as UiTextarea } from '@nova/ui';
import {
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
} from '../../../lib/addresses/addresses-api';

import { apiErrorMessage } from '../../../lib/account/account-state';

import type { AddressFormState } from '../../../pages/account/account-pages-shared';
import { emptyAddressForm } from '../../../pages/account/account-pages-shared';

import { AddressField } from './address-field';

import { addressFormIsComplete } from './address-form-is-complete';

import { toAddressForm } from './to-address-form';

export function CustomerAddressForm({
  mode,
  selectedAddress,
  onSaved,
}: {
  mode: 'create' | 'edit';
  selectedAddress?: CustomerAddress;
  onSaved?: (address: CustomerAddress) => void;
}) {
  const createMutation = useCreateCustomerAddress();
  const updateMutation = useUpdateCustomerAddress();
  const [form, setForm] = useState<AddressFormState>(() =>
    selectedAddress ? toAddressForm(selectedAddress) : { ...emptyAddressForm },
  );
  const [savedForm, setSavedForm] = useState(form);
  const [formError, setFormError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const mutationError = createMutation.error ?? updateMutation.error;
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const next = selectedAddress ? toAddressForm(selectedAddress) : { ...emptyAddressForm };
    setForm(next);
    setSavedForm(next);
    setFormError('');
    setSaveState('idle');
  }, [selectedAddress?.id, mode]);

  const updateField = (field: keyof AddressFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    setSaveState('idle');
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!addressFormIsComplete(form)) {
      setFormError('لطفاً همه بخش‌های آدرس را کامل کنید.');
      setSaveState('error');
      return;
    }
    if (mode === 'edit' && !selectedAddress) {
      setFormError('آدرس انتخاب‌شده در حساب شما پیدا نشد.');
      setSaveState('error');
      return;
    }
    const input: CustomerAddressCreateInput = {
      label: form.label.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      addressLine: form.addressLine.trim(),
      postalCode: form.postalCode.trim(),
      isDefault: form.isDefault,
    };
    setSaveState('saving');
    try {
      const address =
        mode === 'edit' && selectedAddress
          ? await updateMutation.mutateAsync({ addressId: selectedAddress.id, input })
          : await createMutation.mutateAsync(input);
      const next = toAddressForm(address);
      setForm(next);
      setSavedForm(next);
      setSaveState('saved');
      onSaved?.(address);
    } catch (error) {
      setFormError(apiErrorMessage(error, 'ذخیره آدرس انجام نشد؛ دوباره تلاش کنید.'));
      setSaveState('error');
    }
  };
  return (
    <form
      className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <AddressField
          label="عنوان آدرس"
          value={form.label}
          onChange={(value) => updateField('label', value)}
          placeholder="مثلاً خانه"
          autoComplete="address-line1"
        />
        <AddressField
          label="نام تحویل‌گیرنده"
          value={form.recipientName}
          onChange={(value) => updateField('recipientName', value)}
          autoComplete="name"
        />
        <AddressField
          label="شماره تماس"
          value={form.phone}
          onChange={(value) => updateField('phone', value)}
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
        />
        <AddressField
          label="کد پستی"
          value={form.postalCode}
          onChange={(value) => updateField('postalCode', value)}
          placeholder="۱۰ رقمی"
          autoComplete="postal-code"
          inputMode="numeric"
          dir="ltr"
        />
        <AddressField
          label="استان"
          value={form.province}
          onChange={(value) => updateField('province', value)}
          autoComplete="address-level1"
        />
        <AddressField
          label="شهر"
          value={form.city}
          onChange={(value) => updateField('city', value)}
          autoComplete="address-level2"
        />
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
        نشانی کامل
        <UiTextarea
          className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
          rows={4}
          value={form.addressLine}
          onChange={(event) => updateField('addressLine', event.target.value)}
          placeholder="خیابان، کوچه، پلاک و واحد"
          autoComplete="street-address"
        />
      </label>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={form.isDefault}
          onChange={(event) => updateField('isDefault', event.target.checked)}
        />
        این آدرس، آدرس اصلی من باشد
      </label>
      {formError || mutationError ? (
        <p
          className="mt-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
          role="alert"
        >
          {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
        </p>
      ) : null}
      {saveState === 'saved' ? (
        <p
          className="mt-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
          role="status"
        >
          آدرس با موفقیت ذخیره شد.
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !dirty} loading={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره آدرس'}
        </Button>
        <Button asChild variant="outline">
          <a href="#account/addresses">بازگشت به آدرس‌ها</a>
        </Button>
        {dirty ? (
          <span className="text-xs text-muted-foreground" role="status">
            تغییرات ذخیره‌نشده دارید.
          </span>
        ) : null}
      </div>
    </form>
  );
}
