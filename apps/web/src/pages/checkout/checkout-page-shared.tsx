import { type CartView, type CustomerAddressCreateInput } from '@nova/api-client';

import { type CheckoutStep } from '../../lib/checkout/checkout-state';

export interface CheckoutPageProps {
  step: string;
  queryString?: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
}

export const emptyAddressDraft: CustomerAddressCreateInput = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
};

export const steps: Array<{ key: CheckoutStep; label: string }> = [
  { key: 'address', label: 'آدرس' },
  { key: 'shipping', label: 'ارسال' },
  { key: 'payment', label: 'پرداخت' },
];
