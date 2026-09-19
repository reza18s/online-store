import { type FormEvent } from 'react';
import { type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';
import { Button, Input as UiInput, Radio, Textarea as UiTextarea } from '@nova/ui';

import { type CheckoutFailure } from '../../../lib/checkout/checkout-state';
import { Icon } from '../../ui/icon';

export function AddressForm({
  addresses,
  selectedAddressId,
  onSelect,
  showNewAddress,
  onToggleNewAddress,
  draft,
  onDraftChange,
  onCreate,
  creating,
  createFailure,
}: {
  addresses: CustomerAddress[];
  selectedAddressId: string;
  onSelect: (addressId: string) => void;
  showNewAddress: boolean;
  onToggleNewAddress?: () => void;
  draft: CustomerAddressCreateInput;
  onDraftChange: (key: keyof CustomerAddressCreateInput, value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  creating: boolean;
  createFailure: CheckoutFailure | null;
}) {
  return (
    <div className="form-card">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold">آدرس تحویل</legend>
        {addresses.map((address) => (
          <label
            className={`option-card ${selectedAddressId === address.id ? 'is-selected' : ''}`}
            key={address.id}
          >
            <Radio
              checked={selectedAddressId === address.id}
              name="checkout-address"
              onChange={() => onSelect(address.id)}
            />
            <span className="min-w-0">
              <strong>
                {address.label} {address.isDefault ? '· پیش‌فرض' : ''}
              </strong>
              <small>
                {address.recipientName} · {address.province}، {address.city}، {address.addressLine}
              </small>
              <small dir="ltr">
                {address.phone} · {address.postalCode}
              </small>
            </span>
            <Icon name={selectedAddressId === address.id ? 'check' : 'home'} size={18} />
          </label>
        ))}
      </fieldset>
      {onToggleNewAddress ? (
        <Button
          className="min-h-11 justify-center"
          type="button"
          variant="outline"
          onClick={onToggleNewAddress}
        >
          <Icon name={showNewAddress ? 'close' : 'plus'} size={15} />
          {showNewAddress ? 'بستن فرم آدرس جدید' : 'افزودن آدرس جدید'}
        </Button>
      ) : null}
      {showNewAddress ? (
        <form className="grid gap-3 border-t border-border pt-5" onSubmit={onCreate}>
          <h3 className="text-sm font-semibold">آدرس جدید</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['label', 'عنوان آدرس', 'مثلاً خانه'],
                ['recipientName', 'نام گیرنده', 'نام و نام خانوادگی'],
                ['phone', 'شماره موبایل', '09...'],
                ['province', 'استان', 'استان'],
                ['city', 'شهر', 'شهر'],
                ['postalCode', 'کد پستی', 'کد پستی'],
              ] as Array<[keyof CustomerAddressCreateInput, string, string]>
            ).map(([key, label, placeholder]) => (
              <label className="grid gap-1 text-sm" key={key}>
                <span>{label}</span>
                <UiInput
                  className="min-h-11 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                  dir={key === 'phone' || key === 'postalCode' ? 'ltr' : 'rtl'}
                  required
                  value={typeof draft[key] === 'string' ? draft[key] : ''}
                  placeholder={placeholder}
                  autoComplete={
                    key === 'phone' ? 'tel' : key === 'postalCode' ? 'postal-code' : 'off'
                  }
                  onChange={(event) => onDraftChange(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="grid gap-1 text-sm">
            <span>نشانی کامل</span>
            <UiTextarea
              className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              required
              rows={3}
              value={draft.addressLine}
              onChange={(event) => onDraftChange('addressLine', event.target.value)}
            />
          </label>
          {createFailure ? (
            <p className="text-sm leading-7 text-danger" role="alert">
              {createFailure.message}
            </p>
          ) : null}
          <Button disabled={creating} className="min-h-11" type="submit">
            {creating ? 'در حال ذخیره آدرس...' : 'ذخیره و انتخاب آدرس'}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
