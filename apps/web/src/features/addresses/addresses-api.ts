import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type CustomerAddress,
  type CustomerAddressCreateInput,
  type CustomerAddressUpdateInput,
} from '@nova/api-client';

export const customerAddressesPath = '/v1/account/addresses';

export function customerAddressPath(addressId: string): string {
  return `${customerAddressesPath}/${encodeURIComponent(addressId)}`;
}

export function customerAddressDefaultPath(addressId: string): string {
  return `${customerAddressPath(addressId)}/default`;
}

export async function fetchCustomerAddresses(): Promise<CustomerAddress[]> {
  const response = await apiClient.getEnvelope<CustomerAddress[]>(customerAddressesPath);
  return response.data;
}

export async function createCustomerAddress(
  input: CustomerAddressCreateInput,
): Promise<CustomerAddress> {
  const response = await apiClient.postEnvelope<CustomerAddress>(customerAddressesPath, input);
  return response.data;
}

export async function updateCustomerAddress(
  addressId: string,
  input: CustomerAddressUpdateInput,
): Promise<CustomerAddress> {
  const response = await apiClient.patchEnvelope<CustomerAddress>(
    customerAddressPath(addressId),
    input,
  );
  return response.data;
}

export async function setCustomerAddressDefault(addressId: string): Promise<CustomerAddress> {
  const response = await apiClient.postEnvelope<CustomerAddress>(
    customerAddressDefaultPath(addressId),
  );
  return response.data;
}

export async function removeCustomerAddress(addressId: string): Promise<CustomerAddress[]> {
  const response = await apiClient.deleteEnvelope<CustomerAddress[]>(customerAddressPath(addressId));
  return response.data;
}

function invalidateCustomerAddresses(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.account.addresses() });
}

export function useCustomerAddresses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.addresses(),
    queryFn: fetchCustomerAddresses,
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, input }: { addressId: string; input: CustomerAddressUpdateInput }) =>
      updateCustomerAddress(addressId, input),
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}

export function useSetCustomerAddressDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCustomerAddressDefault,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}

export function useRemoveCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCustomerAddress,
    onSuccess: (addresses) => queryClient.setQueryData(queryKeys.account.addresses(), addresses),
  });
}
