import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type CartView,
  type CustomerUser,
  type OtpRequestInput,
  type OtpRequestResponse,
  type OtpVerifyInput,
  type OtpVerifyResponse,
} from '@nova/api-client';

export const customerAuthMePath = '/v1/auth/me';
export const customerAuthOtpRequestPath = '/v1/auth/otp/request';
export const customerAuthOtpVerifyPath = '/v1/auth/otp/verify';
export const customerAuthLogoutPath = '/v1/auth/logout';

export async function fetchCurrentCustomer(): Promise<CustomerUser | null> {
  const response = await apiClient.getEnvelope<CustomerUser | null>(customerAuthMePath);
  return response.data;
}

export async function requestCustomerOtp(input: OtpRequestInput): Promise<OtpRequestResponse> {
  const response = await apiClient.postEnvelope<OtpRequestResponse>(
    customerAuthOtpRequestPath,
    input,
  );
  return response.data;
}

export async function verifyCustomerOtp(input: OtpVerifyInput): Promise<OtpVerifyResponse> {
  const response = await apiClient.postEnvelope<OtpVerifyResponse>(
    customerAuthOtpVerifyPath,
    input,
  );
  return response.data;
}

export async function logoutCustomer(): Promise<null> {
  const response = await apiClient.postEnvelope<null>(customerAuthLogoutPath);
  return response.data;
}

export function shouldDiscardCartCacheOnCustomerVerification(cart: CartView | undefined): boolean {
  return cart?.kind === 'CUSTOMER';
}

type CustomerVerificationQueryClient = Pick<
  QueryClient,
  'getQueryData' | 'removeQueries' | 'setQueryData'
>;

export function applyVerifiedCustomerSession(
  queryClient: CustomerVerificationQueryClient,
  user: CustomerUser,
): void {
  const currentCart = queryClient.getQueryData<CartView>(queryKeys.cart.current());

  queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
  queryClient.removeQueries({ queryKey: queryKeys.orders.all });
  if (shouldDiscardCartCacheOnCustomerVerification(currentCart)) {
    queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
  }
  queryClient.setQueryData(queryKeys.account.current(), user);
}

export function useCurrentCustomer(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.current(),
    queryFn: fetchCurrentCustomer,
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useRequestCustomerOtp() {
  return useMutation({ mutationFn: requestCustomerOtp });
}

export function useVerifyCustomerOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyCustomerOtp,
    onSuccess: (result) => applyVerifiedCustomerSession(queryClient, result.user),
  });
}

export function useLogoutCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutCustomer,
    onSuccess: () => {
      queryClient.setQueryData<CustomerUser | null>(queryKeys.account.current(), null);
      queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
      queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
      queryClient.removeQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
