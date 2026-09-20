import { type CustomerAddressCreateInput, type CustomerOrderDetail } from '@nova/api-client';

export type AccountSection = 'dashboard' | 'profile' | 'orders' | 'addresses';

export const accountNavigation: Array<{
  key: AccountSection;
  label: string;
  icon: 'grid' | 'package' | 'home' | 'user';
}> = [
  { key: 'dashboard', label: 'نمای کلی', icon: 'grid' },
  { key: 'orders', label: 'سفارش‌های من', icon: 'package' },
  { key: 'addresses', label: 'آدرس‌ها', icon: 'home' },
  { key: 'profile', label: 'اطلاعات شخصی', icon: 'user' },
];

export const accountTitles: Record<AccountSection, string> = {
  dashboard: 'حساب کاربری',
  profile: 'اطلاعات شخصی',
  orders: 'سفارش‌های من',
  addresses: 'آدرس‌ها',
};

export type AddressFormState = Required<CustomerAddressCreateInput>;

export const emptyAddressForm: AddressFormState = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
  isDefault: false,
};

export type SubmittedCustomerOrder = {
  routeOrderNumber: string;
  order: CustomerOrderDetail;
};
