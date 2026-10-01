import { useEffect, useState, type FormEvent } from 'react';
import { type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';
import { Button, Checkbox, Textarea as UiTextarea } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import {
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
} from '@/features/account/api/addresses-api';

import { apiErrorMessage } from '@/features/account/state/account-state';

import type { AddressFormState } from '@/features/account/pages/account-pages-shared';
import { emptyAddressForm } from '@/features/account/pages/account-pages-shared';

import { AddressField } from '@/features/account/components/address-field';

import { addressFormIsComplete } from '@/features/account/components/address-form-is-complete';

import { toAddressForm } from '@/features/account/components/to-address-form';

export function CustomerAddressForm({
  mode,
  selectedAddress,
  onSaved,
  onDelete,
}: {
  mode: 'create' | 'edit';
  selectedAddress?: CustomerAddress;
  onSaved?: (address: CustomerAddress) => void;
  onDelete?: () => void;
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
  if (mode === 'create') {
    return (
      <form
        className="nova-address-create-form"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <div className="nova-address-create-form__grid">
          <AddressField
            className="nova-address-create-form__recipient"
            label="نام و نام خانوادگی گیرنده"
            value={form.recipientName}
            onChange={(value) => updateField('recipientName', value)}
            placeholder="مثال: مهسا کریمی"
            autoComplete="name"
            icon="user"
            required
          />
          <AddressField
            className="nova-address-create-form__phone"
            label="شماره تماس"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            icon="user"
            hint="برای هماهنگی ارسال سفارش"
            required
          />
          <AddressField
            label="استان"
            value={form.province}
            onChange={(value) => updateField('province', value)}
            placeholder="مثال: تهران"
            autoComplete="address-level1"
            icon="chevron-down"
            required
          />
          <AddressField
            label="شهر"
            value={form.city}
            onChange={(value) => updateField('city', value)}
            placeholder="مثال: تهران"
            autoComplete="address-level2"
            icon="chevron-down"
            required
          />

          <label className="nova-address-create-form__address">
            <span className="nova-address-create-form__label">
              نشانی کامل <b aria-hidden="true">*</b>
            </span>
            <span className="nova-address-create-form__textarea">
              <UiTextarea
                rows={3}
                value={form.addressLine}
                onChange={(event) => updateField('addressLine', event.target.value)}
                placeholder="مثال: خیابان ولیعصر، بالاتر از میدان ونک، کوچه نسترن، پلاک ۱۲، واحد ۳"
                autoComplete="street-address"
              />
              <Icon name="home" size={17} aria-hidden="true" />
            </span>
            <small>لطفاً نشانی را به‌صورت کامل و دقیق وارد کنید.</small>
          </label>

          <AddressField
            label="عنوان آدرس"
            value={form.label}
            onChange={(value) => updateField('label', value)}
            placeholder="مثال: خانه یا محل کار"
            autoComplete="address-line1"
            icon="home"
            hint="برای شناسایی سریع این آدرس در حساب شما"
            required
          />
          <AddressField
            label="کد پستی"
            value={form.postalCode}
            onChange={(value) => updateField('postalCode', value)}
            placeholder="مثال: ۱۴۳۴۵۶۷۸۹۰"
            autoComplete="postal-code"
            inputMode="numeric"
            dir="ltr"
            icon="mail"
            hint="کد پستی ۱۰ رقمی"
            required
          />
        </div>

        <label className="nova-address-create-form__default">
          <Checkbox
            checked={form.isDefault}
            onChange={(event) => updateField('isDefault', event.target.checked)}
          />
          <span>
            <strong>به عنوان آدرس پیش‌فرض ذخیره شود</strong>
            <small>این آدرس به صورت پیش‌فرض در هنگام ثبت سفارش انتخاب خواهد شد.</small>
          </span>
        </label>

        {formError || mutationError ? (
          <p className="nova-address-create-form__message is-error" role="alert">
            {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
          </p>
        ) : null}

        {saveState === 'saved' ? (
          <p className="nova-address-create-form__message is-success" role="status">
            آدرس با موفقیت ذخیره شد.
          </p>
        ) : null}

        <div className="nova-address-create-form__actions">
          <Button
            className="nova-address-create-form__submit"
            type="submit"
            disabled={saving || !dirty}
            loading={saving}
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره آدرس جدید'}
            <Icon name="arrow-left" size={16} />
          </Button>
          <Button className="nova-address-create-form__back" asChild variant="outline">
            <a href="/account/addresses">بازگشت به آدرس‌ها</a>
          </Button>
          {dirty ? (
            <span className="nova-address-create-form__dirty" role="status">
              تغییرات ذخیره‌نشده دارید.
            </span>
          ) : null}
        </div>
      </form>
    );
  }

  if (mode === 'edit') {
    return (
      <form className="nova-address-edit-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className="nova-address-edit-form__heading">
          <h2>اطلاعات آدرس</h2>
        </div>

        <div className="nova-address-edit-form__grid">
          <AddressField
            className="nova-address-edit-form__wide"
            label="عنوان آدرس"
            value={form.label}
            onChange={(value) => updateField('label', value)}
            placeholder="خانه"
            autoComplete="address-line1"
            icon="home"
          />
          <AddressField
            className="nova-address-edit-form__wide"
            label="نام گیرنده"
            value={form.recipientName}
            onChange={(value) => updateField('recipientName', value)}
            autoComplete="name"
          />
          <AddressField
            className="nova-address-edit-form__wide"
            label="شماره تماس"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
          />
          <AddressField
            label="استان"
            value={form.province}
            onChange={(value) => updateField('province', value)}
            autoComplete="address-level1"
            icon="chevron-down"
          />
          <AddressField
            label="شهر"
            value={form.city}
            onChange={(value) => updateField('city', value)}
            autoComplete="address-level2"
            icon="chevron-down"
          />

          <label className="nova-address-edit-form__address">
            <span>آدرس کامل</span>
            <UiTextarea
              rows={3}
              value={form.addressLine}
              onChange={(event) => updateField('addressLine', event.target.value)}
              placeholder="خیابان، کوچه، پلاک و واحد"
              autoComplete="street-address"
            />
          </label>

          <AddressField
            className="nova-address-edit-form__wide"
            label="کد پستی"
            value={form.postalCode}
            onChange={(value) => updateField('postalCode', value)}
            autoComplete="postal-code"
            inputMode="numeric"
            dir="ltr"
          />
        </div>

        <label className="nova-address-edit-form__default">
          <Checkbox
            checked={form.isDefault}
            onChange={(event) => updateField('isDefault', event.target.checked)}
          />
          این آدرس به عنوان آدرس پیش‌فرض من باشد
        </label>

        {formError || mutationError ? (
          <p className="nova-address-create-form__message is-error" role="alert">
            {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
          </p>
        ) : null}

        {saveState === 'saved' ? (
          <p className="nova-address-create-form__message is-success" role="status">
            آدرس با موفقیت ذخیره شد.
          </p>
        ) : null}

        <div className="nova-address-edit-form__actions">
          <Button className="nova-address-edit-form__save" type="submit" disabled={saving || !dirty} loading={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
          {onDelete ? (
            <Button
              className="nova-address-edit-form__delete"
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={saving}
            >
              <Icon name="close" size={16} />
              حذف آدرس
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

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
          <a href="/account/addresses">بازگشت به آدرس‌ها</a>
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
