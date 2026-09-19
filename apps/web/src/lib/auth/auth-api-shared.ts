import { type QueryClient } from '@tanstack/react-query';

export const customerAuthMePath = '/v1/auth/me';

export const customerAuthOtpRequestPath = '/v1/auth/otp/request';

export const customerAuthOtpVerifyPath = '/v1/auth/otp/verify';

export const customerAuthLogoutPath = '/v1/auth/logout';

export type CustomerVerificationQueryClient = Pick<
  QueryClient,
  'getQueryData' | 'removeQueries' | 'setQueryData'
>;
