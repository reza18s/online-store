export type { CustomerVerificationQueryClient } from './auth-api-shared';
export {
  customerAuthLogoutPath,
  customerAuthMePath,
  customerAuthOtpRequestPath,
  customerAuthOtpVerifyPath,
} from './auth-api-shared';
export { fetchCurrentCustomer } from './auth-api-functions/fetch-current-customer';
export { requestCustomerOtp } from './auth-api-functions/request-customer-otp';
export { verifyCustomerOtp } from './auth-api-functions/verify-customer-otp';
export { logoutCustomer } from './auth-api-functions/logout-customer';
export { shouldDiscardCartCacheOnCustomerVerification } from './auth-api-functions/should-discard-cart-cache-on-customer-verification';
export { applyVerifiedCustomerSession } from './auth-api-functions/apply-verified-customer-session';
export { useCurrentCustomer } from './auth-api-functions/use-current-customer';
export { useRequestCustomerOtp } from './auth-api-functions/use-request-customer-otp';
export { useVerifyCustomerOtp } from './auth-api-functions/use-verify-customer-otp';
export { useLogoutCustomer } from './auth-api-functions/use-logout-customer';
