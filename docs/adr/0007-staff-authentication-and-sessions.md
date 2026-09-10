# ADR-0007: Staff authentication, MFA, and admin sessions

- Status: accepted
- Date: 2026-09-08

## Context

Customer phone OTP authentication is not an appropriate boundary for staff
operations. Staff access needs a stronger factor, explicit role separation,
throttled login attempts, immediate session revocation, and secrets protected
at rest. Frontend route visibility is not a security boundary.

## Decision

Staff accounts reuse the existing `User` identity row and are recognized only
when they have an active account, a `StaffCredential` row, and at least one of
the seeded roles `support`, `operations`, or `admin`. V1 does not expose a
dynamic role or permission editor.

### Credential storage

- Passwords use versioned `scrypt` hashes with a per-password random salt.
- TOTP secrets are encrypted with AES-256-GCM before persistence. The key is
  derived from `STAFF_TOTP_ENCRYPTION_KEY`, which must be changed before
  production startup.
- Recovery codes are stored as keyed HMAC digests and are claimed with a
  conditional one-time update. Plaintext passwords, TOTP secrets, and recovery
  codes are never returned by the API.

The schema stores the credential separately from `User` in
`StaffCredential` and stores recovery codes in `StaffRecoveryCode`. This keeps
customer identity fields separate from staff authentication material and
allows every recovery code to be revoked independently.

### Login and throttling

`POST /v1/staff/auth/login` requires email, password, and either a six-digit
TOTP code or a recovery code. TOTP validation accepts a bounded one-step clock
skew and Persian/Arabic localized digits. Login failures are throttled in the
Redis-backed state store by account/IP and return generic authentication
errors. A successful login clears the failure counters.

### Sessions and authorization

Successful staff login creates a random opaque PostgreSQL session with
`SessionKind.ADMIN`, a 30-minute idle timeout, and a 12-hour absolute timeout.
Only a hash is persisted. The `StaffAuthGuard` resolves the session and the
`StaffRoleGuard` applies the explicit role allowlist. Use cases must also call
the exported role assertion when a business mutation depends on a role;
navigation guards alone are never sufficient.

The session is delivered in an HttpOnly, SameSite cookie. State-changing login
and logout requests remain subject to the global exact-origin and double-submit
CSRF guard.

## Consequences

- Customer sessions and staff sessions cannot authenticate one another because
  their `SessionKind` values are distinct.
- Redis availability is part of staff login throttling; failure is safer than
  silently bypassing the throttle.
- Staff credential provisioning is intentionally not exposed as a public API.
  A controlled provisioning workflow must create the credential and role rows
  before a staff account can log in.
- The existing `AuditEvent` persistence model remains the audit boundary for
  catalog/order/admin mutations; staff login itself does not yet emit an
  audit record until the audit/event policy is implemented with the relevant
  admin use cases.
- PostgreSQL migration/seed and live Redis tests remain required before this
  boundary can be called operational in an environment.
