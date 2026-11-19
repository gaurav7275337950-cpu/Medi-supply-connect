# Security Specification & Payload TDD — MediSupply Connect

## 1. Data Invariants
1. **User PII Isolation**: `/users/{userId}` documents contain email, phone, drug license number, and GSTIN. Only the authenticated verified owner (`request.auth.uid == userId`) or an administrator may read or write them.
2. **No Self-Assigned Roles**: On `/users/{userId}` creation, `role` MUST equal `'pharmacy'`. Users cannot assign `'admin'` or modify `role`, `uid`, `email`, or `createdAt` on update.
3. **Catalog Integrity**: `/distributors/{distributorId}` and `/medicineOffers/{offerId}` are readable by verified signed-in users and writable strictly by administrators.
4. **Order Ownership & Fee Integrity**: `/orders/{orderId}` can only be created when `pharmacyUid == request.auth.uid`, `status == 'Placed'`, `platformFeeInr >= 0`, `totalInr >= subtotalInr`, and server timestamps match `request.time`.
5. **Order State Progression & Terminal Lock**: Orders transition strictly through `Placed -> Confirmed/Cancelled`, `Confirmed -> Dispatched/Cancelled`, `Dispatched -> Delivered`. Once `Delivered` or `Cancelled`, non-admin updates are denied.
6. **Subcollection Atomicity**: `/orders/{orderId}/items/{itemId}` creation verifies `getAfter()` on `/orders/{orderId}` so line items cannot be orphaned or attached to another user's order, and `list` queries evaluate `resource.data.pharmacyUid == request.auth.uid` without `get()`.
7. **Watchlist Scoping**: `/users/{userId}/watchlist/{medicineId}` is strictly scoped to `request.auth.uid == userId` with strict key and boundary validation.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Privilege Escalation on Signup**: `POST /users/uid123` with `{ role: "admin", ... }`.
2. **Role Mutation on Update**: `PATCH /users/uid123` changing `role` from `"pharmacy"` to `"admin"`.
3. **Cross-User PII Read**: Authenticated `uid_A` calling `GET /users/uid_B`.
4. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting `POST /orders/ord1`.
5. **Shadow Ghost Field Injection**: `POST /users/uid123` including undeclared key `isVerifiedPartner: true`.
6. **Order Identity Spoofing**: `uid_A` creating `/orders/ord1` with `pharmacyUid: "uid_B"`.
7. **State Shortcutting on Create**: Creating `/orders/ord1` directly with `status: "Delivered"`.
8. **Terminal State Tampering**: Non-admin updating `/orders/ord1` after `status == "Delivered"`.
9. **ID Poisoning**: Creating `/orders/very_long_id_over_128_chars...` or `orders/invalid$id`.
10. **Client Timestamp Forgery**: Creating `/orders/ord1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
11. **Orphaned Line Item Injection**: Creating `/orders/non_existent/items/item1` without parent order in the same batch.
12. **Blanket List Scraping**: `uid_A` running `list /orders` without filtering `pharmacyUid == uid_A`.
