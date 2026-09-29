[//]: # (# Findings)

[//]: # ()
[//]: # (One section per bug. Add or remove sections as needed — the headings are only a)

[//]: # (starting point, not a form you have to fill in exactly.)

[//]: # ()
[//]: # (---)

[//]: # ()
[//]: # (## 1. <short title>)

[//]: # ()
[//]: # (**What happens**)

[//]: # ()
[//]: # (<One or two plain sentences.>)

[//]: # ()
[//]: # (**Steps to reproduce**)

[//]: # ()
[//]: # (1.)

[//]: # (2.)

[//]: # (3.)

[//]: # ()
[//]: # (**What should happen instead**)

[//]: # ()
[//]: # (<>)

[//]: # ()
[//]: # (**Impact — how bad is this, and why?**)

[//]: # ()
[//]: # (<Does it cost money, leak pricing or customer data, or is it cosmetic? Say who)

[//]: # (is affected and under what conditions.>)

[//]: # ()
[//]: # (**Failing test**)

[//]: # ()
[//]: # (`<path/to/your.test.ts>` — `<test name>`)

[//]: # ()
[//]: # (---)

[//]: # ()
[//]: # (## 2. <short title>)

[//]: # ()
[//]: # (...)
--------------
--------------
--------------
# Assessment Findings: Bugs & Security Vulnerabilities

### BUG-01: Broken Access Control on Catalogue Publishing (Privilege Escalation)
- **Summary**: Authenticated users with the `staff` role can publish catalogues via the admin API or server actions, violating the stated security policy that publishing is strictly admin-only.
- **Severity & Impact**: **Critical / High**. Exposes unvetted stock, pricing, and internal inventory changes to the public internet without administrative review.
- **Steps to Reproduce**:
    1. Authenticate with a `staff` session.
    2. Send a `PATCH` request to `/api/admin/catalogues/[id]` with payload `{"status": "published", ...}`.
    3. The endpoint returns `200 OK` and flips status to `published` instead of rejecting with `403 Forbidden`.
- **Expected Behavior**: Server must verify `isAdmin(actor)` and return `403 Forbidden` if a non-admin role attempts to publish.
- **Failing Automated Test**: `tests/api/access-control.test.ts` > `"SECURITY BUG: blocks staff from publishing a catalogue (should return 403 Forbidden)"`

---

### BUG-02: Inverted Expiry Date Lifecycle Logic
- **Summary**: `effectiveStatus()` marks catalogues with future expiry dates as `"expired"`, while past/expired catalogues remain `"published"`.
- **Severity & Impact**: **High**. Legitimate, active catalogues are hidden as expired immediately upon setting a future date, while stale catalogues remain active indefinitely.
- **Steps to Reproduce**:
    1. Call `effectiveStatus("published", futureDate)` where `futureDate > new Date()`.
    2. Function returns `"expired"` instead of `"published"`.
- **Expected Behavior**: `effectiveStatus` should only return `"expired"` if `expiresAt <= new Date()`.
- **Failing Automated Test**: `tests/unit/catalogue-status.test.ts` > `"BUG: published catalogue with a future expiry date should remain published"` and `"BUG: published catalogue with a past expiry date should be marked expired"`

---

### BUG-03: Negative Discount Display When Offer Price Exceeds MRP
- **Summary**: When an offer price is higher than the MRP, `discountPercent()` returns a negative number rather than clamping to 0% or throwing a validation error.
- **Severity & Impact**: **Medium**. Causes UI anomalies (e.g., displaying "-20% OFF") on public buyer-facing catalogues, misleading buyers and undermining platform credibility.
- **Steps to Reproduce**:
    1. Call `discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: 120 })`.
    2. Function returns `-20`.
- **Expected Behavior**: Discounts should never evaluate to a negative percentage; the function should clamp to `0`.
- **Failing Automated Test**: `tests/unit/pricing.test.ts` > `"BUG: should not return a negative discount when offer price exceeds MRP"`

---

### BUG-04: Enquiries Allowed on Unpublished / Draft Catalogues
- **Summary**: The public `/api/enquiries` endpoint does not verify whether the referenced catalogue is published and valid before creating enquiries.
- **Severity & Impact**: **Medium / High**. Attackers or bots can spam leads against draft catalogues, triggering automated lead notifications to sales teams for incomplete products.
- **Steps to Reproduce**:
    1. Send a `POST` request to `/api/enquiries` with a valid UUID of a `draft` catalogue.
    2. The enquiry is saved with status `201 Created` and team notification is triggered.
- **Expected Behavior**: The API should verify catalogue status and reject enquiries for drafts or expired catalogues with `400` or `404`.
- **Failing Automated Test**: `tests/api/access-control.test.ts` > `"BUG: rejects enquiry submission when catalogue is in draft status"`

---

### BUG-05: Substring Collision in CSV Import Auto-Mapping
- **Summary**: In `autoMap()`, matching checks `normalized.includes(key)`, causing column names like `"List Price"` to prematurely match the `"price"` token inside `offerPrice` synonyms instead of matching `mrp`.
- **Severity & Impact**: **Medium**. Causes incorrect column mapping during bulk catalog imports, potentially swapping MRP and Offer Price and creating major financial discrepancies.
- **Steps to Reproduce**:
    1. Call `autoMap(["List Price", "Selling Price"])`.
    2. `"List Price"` is mapped to `"offerPrice"`.
- **Expected Behavior**: Exact matches or prioritized tokens should be evaluated first before fallback substring inclusion.
- **Failing Automated Test**: `tests/unit/import-mapping.test.ts` > `"autoMap > BUG: maps 'List Price' to MRP rather than colliding into offerPrice via 'price' substring"`