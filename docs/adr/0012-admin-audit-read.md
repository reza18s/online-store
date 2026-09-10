# ADR-0012 — Admin audit read boundary

- Status: Accepted
- Date: 2026-09-08
- Owners: NOVA engineering

## Context

Commerce mutations now record audit events for catalog, inventory, payment, order, fulfillment, shipment, cancellation, and return workflows. The operations team needs a searchable history without direct database access, but audit metadata can contain customer-supplied reasons and payment-related amounts and must not become a broadly readable endpoint.

## Decision

- Expose a read-only `GET /v1/admin/audit-events` endpoint to the `admin` role only. The role is enforced by both the route guards and the application service.
- Support bounded page/limit pagination and exact filters for action, resource type, resource ID, actor user ID, and actor type. Results are ordered newest-first with a stable ID tie-breaker.
- Return actor/resource identity, action, timestamps, and recorded metadata. Payment provider transaction IDs, raw webhook payloads, authentication secrets, and other fields not stored in the audit event are not reconstructed or added to this response.
- Keep audit writes in the existing `AuditService` and expose the read boundary through a separate admin service/controller. Browser code receives only page-agnostic query transport and cache-key helpers; visual audit screens wait for the user's supplied page reference.

## Consequences

- An administrator can inspect the mutation trail without editing the database, while support and operations remain unable to browse potentially sensitive audit metadata through this endpoint.
- Audit search is intentionally exact-filtered and offset-paginated for the current bounded interface. Full-text audit search, export, retention, redaction policy, and immutable archival storage remain follow-up decisions.
