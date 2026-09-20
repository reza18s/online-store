export type { CustomerVerificationQueryClient } from '@/features/auth/api/auth-api-shared';
export {
  customerAuthLogoutPath,
  customerAuthMePath,
  customerAuthOtpRequestPath,
  customerAuthOtpVerifyPath,
} from '@/features/auth/api/auth-api-shared';
export { fetchCurrentCustomer } from '@/features/auth/api/fetch-current-customer';
export { requestCustomerOtp } from '@/features/auth/api/request-customer-otp';
export { verifyCustomerOtp } from '@/features/auth/api/verify-customer-otp';
export { logoutCustomer } from '@/features/auth/api/logout-customer';
export { shouldDiscardCartCacheOnCustomerVerification } from '@/features/auth/api/should-discard-cart-cache-on-customer-verification';
export { applyVerifiedCustomerSession } from '@/features/auth/api/apply-verified-customer-session';
export { useCurrentCustomer } from '@/features/auth/api/use-current-customer';
export { useRequestCustomerOtp } from '@/features/auth/api/use-request-customer-otp';
export { useVerifyCustomerOtp } from '@/features/auth/api/use-verify-customer-otp';
export { useLogoutCustomer } from '@/features/auth/api/use-logout-customer';
