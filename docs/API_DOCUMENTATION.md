# AGE AI Backend — Frontend Developer Integration Guide & API Specification

> **For Frontend Developers & AI Coding Agents (Cursor / Windsurf / Copilot)**  
> This specification documents all available REST endpoints, authentication lifecycles, request payloads, response schemas, error formats, TypeScript types, and routing logic for the AGE AI Backend.

---

## Table of Contents

1. [General API Conventions](#1-general-api-conventions)
2. [Authentication & Two-Token Lifecycle](#2-authentication--two-token-lifecycle)
3. [Tenant Onboarding Flow (Step-by-Step)](#3-tenant-onboarding-flow-step-by-step)
4. [Endpoint Reference: Authentication & Onboarding](#4-endpoint-reference-authentication--onboarding)
   - [`POST /api/check-email`](#post-apicheck-email)
   - [`POST /api/register`](#post-apiregister)
   - [`POST /api/login`](#post-apilogin)
   - [`POST /api/verify-otp`](#post-apiverify-otp)
   - [`POST /api/resend-otp`](#post-apiresend-otp)
   - [`GET /api/user`](#get-apiuser)
   - [`POST /api/complete-profile`](#post-apicomplete-profile)
5. [Endpoint Reference: Clients (CRM)](#5-endpoint-reference-clients-crm)
   - [`GET /api/clients`](#get-apiclients)
   - [`POST /api/clients`](#post-apiclients)
   - [`GET /api/clients/{id}`](#get-apiclientsid)
   - [`PUT /api/clients/{id}`](#put-apiclientsid)
   - [`DELETE /api/clients/{id}`](#delete-apiclientsid)
   - [`GET /api/clients/stats`](#get-apiclientsstats)
   - [`POST /api/clients/{id}/toggle-dnc`](#post-apiclientsidtoggle-dnc)
6. [Endpoint Reference: Duewise (Invoice Management, AI & Collections)](#6-endpoint-reference-duewise-invoice-management-ai--collections)
    - **6.1 Dashboard, AI Intelligence Briefing & Cash Flow Forecast**
      - [`GET /api/duewise/dashboard`](#get-apiduewisedashboard)
      - [`GET /api/duewise/dashboard/ai-briefing`](#get-apiduewisedashboardai-briefing)
      - [`GET /api/duewise/entitlements`](#get-apiduewiseentitlements)
      - [`GET /api/duewise/forecast`](#get-apiduewiseforecast)
   - **6.2 Invoices CRUD & Operations**
     - [`GET /api/duewise/invoices`](#get-apiduewiseinvoices)
     - [`POST /api/duewise/invoices`](#post-apiduewiseinvoices)
     - [`GET /api/duewise/invoices/{id}`](#get-apiduewiseinvoicesid)
     - [`PUT /api/duewise/invoices/{id}`](#put-apiduewiseinvoicesid)
     - [`DELETE /api/duewise/invoices/{id}`](#delete-apiduewiseinvoicesid)
     - [`POST /api/duewise/invoices/{id}/mark-as-paid`](#post-apiduewiseinvoicesidmark-as-paid)
     - [`POST /api/duewise/invoices/{id}/toggle-dnc`](#post-apiduewiseinvoicesidtoggle-dnc)
     - [`GET /api/duewise/invoices/{id}/prediction`](#get-apiduewiseinvoicesidprediction)
     - [`POST /api/duewise/invoices/{id}/predict`](#post-apiduewiseinvoicesidpredict)
     - [`POST /api/duewise/invoices/{id}/remind`](#post-apiduewiseinvoicesidremind)
     - [`GET /api/duewise/invoices/{id}/activity`](#get-apiduewiseinvoicesidactivity)
   - **6.3 Outbound Approval Mode & Pending Queue**
     - [`GET /api/duewise/reminders/mode`](#get-apiduewiseremindersmode)
     - [`POST /api/duewise/reminders/mode`](#post-apiduewiseremindersmode)
     - [`POST /api/duewise/reminders/enable-autopilot`](#post-apiduewiseremindersenable-autopilot)
     - [`POST /api/duewise/reminders/enable-approval-mode`](#post-apiduewiseremindersenable-approval-mode)
     - [`GET /api/duewise/reminders/approvals`](#get-apiduewiseremindersapprovals)
     - [`POST /api/duewise/reminders/approvals/{id}/approve`](#post-apiduewiseremindersapprovalsidapprove)
     - [`POST /api/duewise/reminders/approvals/{id}/reject`](#post-apiduewiseremindersapprovalsidreject)
     - [`POST /api/duewise/reminders/approvals/approve-all`](#post-apiduewiseremindersapprovalsapprove-all)
   - **6.4 Tone Control & AI Preview Copywriter**
     - [`POST /api/duewise/reminders/tone-preview`](#post-apiduewisereminderstone-preview)
     - [`POST /api/duewise/reminders/default-tone`](#post-apiduewiseremindersdefault-tone)
   - **6.5 QuickBooks Online 2-Way Integration**
     - [`GET /api/duewise/quickbooks/connect`](#get-apiduewisequickbooksconnect)
     - [`GET|POST /api/duewise/quickbooks/callback`](#getpost-apiduewisequickbookscallback)
     - [`GET /api/duewise/quickbooks/status`](#get-apiduewisequickbooksstatus)
     - [`POST /api/duewise/quickbooks/sync`](#post-apiduewisequickbookssync)
     - [`POST /api/duewise/quickbooks/disconnect`](#post-apiduewisequickbooksdisconnect)
   - **6.6 Unified Accounts & Integrations Status (QuickBooks + Stripe)**
     - [`GET /api/accounts/status` (or `/api/duewise/accounts/status`)](#get-apiaccountsstatus)
   - **6.7 Monthly Recovery Fee Engine (Base 15% vs Big Books 10%)**
      - [`GET /api/duewise/recovery-fee/current-cycle`](#get-apiduewiserecovery-feecurrent-cycle)
      - [`GET /api/duewise/recovery-fee/batches`](#get-apiduewiserecovery-feebatches)
      - [`POST /api/duewise/recovery-fee/batches/{id}/retry`](#post-apiduewiserecovery-feebatchesidretry)
   - **6.8 Public Communication Tracking (No Auth)**
     - [`GET /api/duewise/track/open/{token}`](#get-apiduewisetrackopentoken)
     - [`GET /api/duewise/track/click/{token}`](#get-apiduewisetrackclicktoken)
   - **6.9 Public Invoice Payment Portal & Stripe Checkout (No Auth)**
     - [`GET /pay/{id}`](#get-payid)
     - [`POST /pay/{id}/checkout`](#post-payidcheckout)
     - [`GET /pay/{id}/success`](#get-payidsuccess)
7. [Endpoint Reference: Billing, Stripe Connect & Subscriptions](#7-endpoint-reference-billing--subscriptions)
   - [`GET /api/billing/plans`](#get-apibillingplans)
   - [`GET /api/billing/transactions`](#get-apibillingtransactions)
   - [`POST /api/billing/setup-intent`](#post-apibillingsetup-intent)
   - [`GET /api/billing/payment-methods`](#get-apibillingpayment-methods)
   - [`POST /api/billing/payment-methods`](#post-apibillingpayment-methods)
   - [`DELETE /api/billing/payment-methods/{id}`](#delete-apibillingpayment-methodsid)
   - [`GET /api/billing/subscription`](#get-apibillingsubscription)
   - [`POST /api/billing/subscribe`](#post-apibillingsubscribe)
   - [`POST /api/billing/cancel`](#post-apibillingcancel)
   - [`POST /api/billing/performance-fees`](#post-apibillingperformance-fees)
   - **Stripe Connect (Bank Account Attachment & Direct Payouts)**
     - [`POST /api/billing/connect/onboard`](#post-apibillingconnectonboard)
     - [`GET /api/billing/connect/status`](#get-apibillingconnectstatus)
     - [`GET /api/billing/connect/login-link`](#get-apibillingconnectlogin-link)
   - [Product & Plan Catalog](#product--plan-catalog)
8. [Standard Error Responses](#8-standard-error-responses)
9. [Complete TypeScript Definitions](#9-complete-typescript-definitions)
10. [Ready-to-Use Axios API Client Snippet](#10-ready-to-use-axios-api-client-snippet)

---

## 1. General API Conventions

### Base URLs
- **Local Development**: `http://localhost:8000` (or `http://127.0.0.1:8000`)
- **Staging / Production**: Configured via environment variable `VITE_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`.

### Mandatory Request Headers
Always send these headers with every JSON request:
```http
Content-Type: application/json
Accept: application/json
```
For authenticated requests, also include:
```http
Authorization: Bearer <token>
```

---

## 2. Authentication & Two-Token Lifecycle

The system utilizes a secure **Two-Token Architecture**:

| Token Type | Issued By | Abilities | Expiration | Can Access |
|---|---|---|---|---|
| **Temporary Token** (`temp_token`) | `POST /api/register` | `['otp:verify']` | 15 Minutes | **ONLY** `POST /api/verify-otp` (Blocked from `/complete-profile`, `/user`, `/clients`, etc. with `403 Forbidden`) |
| **Permanent Token** (`api`) | `POST /api/verify-otp` & `POST /api/login` | `['*']` | Permanent | **ALL** authenticated endpoints (`/user`, `/complete-profile`, `/clients`, `/invoices`, `/billing`) |

### Token Lifecycle Rules for Frontend:
1. When user registers, store `token` temporarily in memory or `sessionStorage`.
2. When calling `POST /api/verify-otp`, pass this temporary token in `Authorization: Bearer <temp_token>`.
3. Upon successful OTP verification, the backend **deletes the temporary token** and issues a **permanent token**.
4. Replace the stored token with the new permanent token in `localStorage` or persistent secure cookies.
5. If an unverified user calls `POST /api/register` again, the backend allows re-registration, updates credentials, and dispatches a fresh OTP and temporary token.

---

## 3. Tenant Onboarding Flow (Step-by-Step)

```
[Screen 1: Enter Email]
       │
       ▼
POST /api/check-email
       │
       ├─ If is_registered: true  ──► Redirect to [Screen: Login]
       │
       └─ If is_registered: false ──► Proceed to [Screen 2: Create Password]
                                              │
                                              ▼
                                      POST /api/register
                                      (Returns: temp_token, sends 6-digit OTP to email)
                                              │
                                              ▼
                                      [Screen 3: Enter OTP Code]
                                              │
                                              ▼
                                      POST /api/verify-otp (with temp_token & OTP code)
                                      (Returns: permanent_token, email_verified_at set)
                                              │
                                              ▼
                                      [Screen 4: Complete Business Profile]
                                              │
                                              ▼
                                      POST /api/complete-profile (with permanent_token)
                                      (Sets: is_profile_complete: true)
                                              │
                                              ▼
                                      [Main App Dashboard]
```

### Redirection Logic Matrix (Route Guards):
- If `!isAuthenticated` ➔ Redirect to `/login`.
- If `isAuthenticated && is_temporary` ➔ Redirect to `/verify-otp`.
- If `isAuthenticated && !is_profile_complete` ➔ Redirect to `/complete-profile`.
- If `isAuthenticated && is_profile_complete` ➔ Allow access to Dashboard (`/dashboard`).

---

## 4. Endpoint Reference: Authentication & Onboarding

### `POST /api/check-email`
Checks whether an email address is already registered and verified in the database.

- **Auth Required**: No (Public)
- **Rate Limit**: 60 requests/minute

#### Request Body
```json
{
  "email": "sarah@acmelaw.com"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | Valid email address to check. |

#### Response: `200 OK`
```json
{
  "email": "sarah@acmelaw.com",
  "is_registered": false,
  "message": "Email is available for registration."
}
```
*(If already registered: `"is_registered": true`, `"message": "Email is already registered."`)*

---

### `POST /api/register`
Creates an initial provisional tenant account (with automatic 7-day trial), creates the owner user, generates a 6-digit OTP, and emails it.

- **Auth Required**: No (Public)
- **Rate Limit**: 60 requests/minute
- **Special Behavior**: If email exists but was never verified (`email_verified_at === null`), re-calling this endpoint updates credentials, resets OTP, and returns a new temporary token without throwing a unique constraint error.

#### Request Body
```json
{
  "email": "sarah@acmelaw.com",
  "password": "StrongPassword123!",
  "password_confirmation": "StrongPassword123!"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | Valid email address. Unique among verified users. |
| `password` | `string` | **Yes** | Minimum 8 characters. |
| `password_confirmation` | `string` | Optional | Must match `password` if provided. |

#### Response: `201 Created`
```json
{
  "user": {
    "id": 12,
    "name": null,
    "email": "sarah@acmelaw.com",
    "phone": null,
    "tenant_id": "tenant-b7e19f2a",
    "roles": ["client_owner"],
    "email_verified_at": null,
    "is_profile_complete": false,
    "created_at": "2026-09-08T18:00:00.000000Z",
    "updated_at": "2026-09-08T18:00:00.000000Z",
    "tenant": {
      "id": "tenant-b7e19f2a",
      "name": null,
      "business_type": null,
      "business_category": null,
      "phone": null,
      "country": "US",
      "currency": "usd",
      "timezone": "UTC",
      "website": null,
      "tax_id": null,
      "trial_ends_at": null,
      "on_trial": false
    }
  },
  "token": "1|temp_token_plain_text_string...",
  "token_type": "Bearer",
  "is_temporary": true
}
```

#### Error: `422 Unprocessable Content` (Email already taken and verified)
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": [
      "The email has already been taken."
    ]
  }
}
```

---

### `POST /api/login`
Authenticates existing verified user and returns a **permanent access token**.

- **Auth Required**: No (Public)
- **Rate Limit**: 60 requests/minute

#### Request Body
```json
{
  "email": "sarah@acmelaw.com",
  "password": "StrongPassword123!",
  "device_name": "Chrome on MacOS"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | Registered email. |
| `password` | `string` | **Yes** | User password. |
| `device_name` | `string` | Optional | Friendly identifier for the token (defaults to `'api'`). |

#### Response: `200 OK`
```json
{
  "user": {
    "id": 12,
    "name": "Sarah Jenkins",
    "email": "sarah@acmelaw.com",
    "tenant_id": "tenant-b7e19f2a",
    "roles": ["client_owner"],
    "email_verified_at": "2026-09-08T18:05:00.000000Z",
    "is_profile_complete": true,
    "tenant": {
      "id": "tenant-b7e19f2a",
      "name": "Acme Law LLC",
      "on_trial": true
    }
  },
  "token": "2|permanent_token_plain_text_string...",
  "token_type": "Bearer",
  "is_temporary": false
}
```

#### Error: `400 Bad Request` (Invalid credentials)
```json
{
  "message": "Invalid credentials.",
  "error": "InvalidCredentialsException"
}
```

---

### `POST /api/verify-otp`
Verifies the 6-digit OTP code sent to user email. Upon success, revokes the temporary token and issues a **permanent token**.

- **Auth Required**: Pass temporary token in `Authorization: Bearer <temp_token>` OR in request body as `"token": "<temp_token>"`.
- **Rate Limit**: 60 requests/minute

#### Request Headers
```http
Authorization: Bearer <temp_token>
```

#### Request Body
```json
{
  "otp": "492018"
}
```
*(Optionally include `"email": "sarah@acmelaw.com"` if header is not used)*

| Parameter | Type | Required | Description |
|---|---|---|---|
| `otp` | `string` | **Yes** | 6-digit numeric verification code received by email. |
| `email` | `string` | Conditional | Required only if `Authorization` header or `token` body field is not passed. |
| `token` | `string` | Optional | Can pass the temporary token here instead of `Authorization` header. |

#### Response: `200 OK`
```json
{
  "message": "Email verified successfully.",
  "verified": true,
  "user": {
    "id": 12,
    "name": null,
    "email": "sarah@acmelaw.com",
    "email_verified_at": "2026-09-08T18:05:12.000000Z",
    "is_profile_complete": false,
    "tenant": {
      "id": "tenant-b7e19f2a",
      "name": null,
      "on_trial": true
    }
  },
  "token": "3|permanent_access_token_string...",
  "token_type": "Bearer",
  "is_temporary": false
}
```

#### Error: `422 Unprocessable Content` (Invalid / Expired code)
```json
{
  "message": "The provided verification code is invalid or has expired.",
  "error": "InvalidOtpException"
}
```

#### Error: `401 Unauthorized` (Invalid or Expired Temporary Token)
```json
{
  "message": "Invalid or expired temporary token.",
  "error": "InvalidTokenException"
}
```

---

### `POST /api/resend-otp`
Triggers a new 6-digit OTP code to the given email address with 60-second cooldown protection.

- **Auth Required**: No (Public)
- **Rate Limit**: 60 requests/minute

#### Request Body
```json
{
  "email": "sarah@acmelaw.com"
}
```

#### Response: `200 OK`
```json
{
  "message": "Verification code sent successfully to your email."
}
```

#### Error: `429 Too Many Requests` (Within 60s cooldown)
```json
{
  "message": "Too many OTP's requested, try again after: 48 seconds",
  "error": "TooManyOtpRequestsException",
  "retry_after_seconds": 48
}
```

---

### `GET /api/user`
Fetches current authenticated user information and associated tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Note**: Temporary tokens receive `403 Forbidden`.

#### Response: `200 OK`
```json
{
  "data": {
    "id": 12,
    "name": "Sarah Jenkins",
    "email": "sarah@acmelaw.com",
    "phone": "+15551234567",
    "tenant_id": "tenant-b7e19f2a",
    "roles": ["client_owner"],
    "email_verified_at": "2026-09-08T18:05:12.000000Z",
    "is_profile_complete": true,
    "created_at": "2026-09-08T18:00:00.000000Z",
    "updated_at": "2026-09-08T18:10:00.000000Z",
    "tenant": {
      "id": "tenant-b7e19f2a",
      "name": "Acme Legal Solutions LLC",
      "business_type": "llc",
      "business_category": "legal_services",
      "phone": "+15559876543",
      "country": "US",
      "currency": "usd",
      "timezone": "America/New_York",
      "website": "https://acmelegal.com",
      "tax_id": "EIN-12-3456789",
      "business_tone": "professional",
      "trial_ends_at": null,
      "on_trial": false
    }
  }
}
```

---

### `POST /api/complete-profile`
Completes user personal profile and tenant business details after OTP verification. Can only be completed once.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Note**: Temporary tokens receive `403 Forbidden`.

#### Request Body
```json
{
  "name": "Sarah Jenkins",
  "phone": "+15551234567",
  "business_name": "Acme Legal Solutions LLC",
  "business_type": "llc",
  "business_category": "legal_services",
  "business_phone": "+15559876543",
  "country": "US",
  "currency": "usd",
  "timezone": "America/New_York",
  "website": "https://acmelegal.com",
  "tax_id": "EIN-12-3456789",
  "business_tone": "professional"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | User full name (Max: 255). |
| `business_name` | `string` | **Yes** | Registered company name (Max: 255). |
| `business_type` | `string` | **Yes** | e.g., `'llc'`, `'corporation'`, `'sole_proprietorship'`, `'partnership'`. |
| `business_category` | `string` | **Yes** | e.g., `'legal_services'`, `'consulting'`, `'medical'`, `'accounting'`. |
| `phone` | `string` | Optional | User direct phone (Max: 50). |
| `business_phone` | `string` | Optional | Company official phone (Max: 50). |
| `country` | `string` | Optional | Country code or name (e.g. `'US'`, default `'US'`). |
| `currency` | `string` | Optional | 3-letter currency code (e.g. `'usd'`). |
| `timezone` | `string` | Optional | e.g. `'America/New_York'`. |
| `website` | `string` | Optional | Valid URL (e.g. `'https://acmelegal.com'`). |
| `tax_id` | `string` | Optional | EIN / VAT / Tax ID number. |
| `business_tone` | `string` | Optional | Default brand reminder voice: `'polite'`, `'professional'`, or `'firm'`. **Defaults to `'professional'` if omitted.** |

#### Response: `200 OK`
```json
{
  "data": {
    "id": 12,
    "name": "Sarah Jenkins",
    "email": "sarah@acmelaw.com",
    "phone": "+15551234567",
    "tenant_id": "tenant-b7e19f2a",
    "roles": ["client_owner"],
    "email_verified_at": "2026-09-08T18:05:12.000000Z",
    "is_profile_complete": true,
    "tenant": {
      "id": "tenant-b7e19f2a",
      "name": "Acme Legal Solutions LLC",
      "business_type": "llc",
      "business_category": "legal_services",
      "phone": "+15559876543",
      "country": "US",
      "currency": "usd",
      "timezone": "America/New_York",
      "website": "https://acmelegal.com",
      "tax_id": "EIN-12-3456789",
      "business_tone": "professional",
      "trial_ends_at": null,
      "on_trial": false
    }
  },
  "message": "Business profile completed successfully."
}
```

#### Error: `400 Bad Request` (If profile was already completed)
```json
{
  "message": "Profile is already completed.",
  "error": "ProfileAlreadyCompletedException"
}
```

---

## 5. Endpoint Reference: Clients (CRM)

All client endpoints are tenant-scoped automatically. A tenant can only access and modify their own clients.
- **Access Requirement**: Requires an authenticated user with a permanent token (`Bearer <permanent_token>`). **NO product subscription or trial is required** to create, view, list, update, or delete clients. Clients represent the tenant's own CRM directory and are accessible completely free without subscribing to any product. (Product subscriptions such as `duewise` are only required for invoice collection automation endpoints like `/api/invoices`).

### `GET /api/clients`
List all clients under the current tenant with pagination support.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Query Parameters**:
  - `page` (Optional, integer, default: `1`): Current page number.
  - `per_page` (Optional, integer, default: `15`, max: `100`): Number of records per page.
  - `risk_tier` (Optional, string): Filter by risk level (`'low'`, `'medium'`, `'high'`, `'critical'`).
  - `do_not_contact` (Optional, boolean): Filter clients by DNC status (`true` or `false`).
  - `search` (Optional, string): Text search by client name, company name, or email.

#### Response: `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "tenant-b7e19f2a",
      "name": "Acme Corp Ltd",
      "company_name": "Acme International",
      "email": "billing@acmecorp.com",
      "phone": "+15552345678",
      "whatsapp_phone": "+15552345678",
      "currency": "USD",
      "tax_number": "TAX-12345",
      "address": "123 Business Way, Suite 400, New York, NY",
      "preferred_channel": "email",
      "ai_recommended_channel": "whatsapp",
      "effective_channel": "email",
      "do_not_contact": false,
      "reminder_tone": "polite",
      "resolved_tone": "polite",
      "ai_late_risk_score": 12.5,
      "risk_tier": "low",
      "average_days_to_pay": 14,
      "total_invoices_count": 5,
      "late_invoices_count": 0,
      "total_outstanding": 1250.0,
      "total_recovered": 4500.0,
      "quickbooks_id": null,
      "quickbooks_synced_at": null,
      "metadata": {},
      "created_at": "2026-09-08T18:30:00.000000Z",
      "updated_at": "2026-09-08T18:30:00.000000Z"
    }
  ],
  "links": {
    "first": "https://api.example.com/api/clients?page=1",
    "last": "https://api.example.com/api/clients?page=3",
    "prev": null,
    "next": "https://api.example.com/api/clients?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "to": 15,
    "total": 35
  }
}
```

---

### `POST /api/clients`
Create a new client for the tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Request Body
```json
{
  "name": "Acme Corp Ltd",
  "company_name": "Acme International",
  "email": "billing@acmecorp.com",
  "phone": "+15552345678",
  "whatsapp_phone": "+15552345678",
  "currency": "USD",
  "tax_number": "TAX-12345",
  "address": "123 Business Way, Suite 400, New York, NY",
  "preferred_channel": "email",
  "do_not_contact": false,
  "reminder_tone": "polite",
  "risk_tier": "low"
}
```

| Parameter | Type | Required | Allowed Values / Validation |
|---|---|---|---|
| `name` | `string` | **Yes** | Max: 255. |
| `company_name` | `string` | Optional | Max: 255. |
| `email` | `string` | Optional | Unique per tenant. |
| `phone` | `string` | Optional | Max: 50. |
| `whatsapp_phone` | `string` | Optional | Max: 50. |
| `currency` | `string` | Optional | 3-letter currency code (e.g. `'USD'`). |
| `tax_number` | `string` | Optional | Max: 100. |
| `address` | `string` | Optional | Max: 1000. |
| `preferred_channel` | `string` | Optional | `'email'`, `'sms'`, `'whatsapp'`, `'call'`. |
| `do_not_contact` | `boolean` | Optional | Set to `true` to block all automated/manual collection reminders for this client. Default: `false`. |
| `reminder_tone` | `string` | Optional | Override tone for this client: `'polite'`, `'professional'`, `'firm'`, or `null` (inherit tenant default). |
| `risk_tier` | `string` | Optional | `'low'`, `'medium'`, `'high'`. |
| `quickbooks_id` | `string` | Optional | QuickBooks customer ID. |
| `metadata` | `object` | Optional | Key-value JSON object. |

#### Response: `201 Created`
Returns the created `Client` object in `{ "data": { ... } }` (includes `do_not_contact`, `reminder_tone`, and `resolved_tone`).

---

### `GET /api/clients/{id}`
Retrieve a single client by ID.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Response**: `200 OK` with `{ "data": { ... } }`.
- **Error**: `404 Not Found` if client does not belong to the tenant.

---

### `PUT /api/clients/{id}`
Update existing client details.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Request Body**: Same fields as `POST /api/clients` (all optional).
- **Response**: `200 OK` with updated `{ "data": { ... } }`.

---

### `DELETE /api/clients/{id}`
Deletes a client belonging to the tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Response: `200 OK`**:
```json
{
  "message": "Client deleted successfully."
}
```
- **Error**: `404 Not Found` if client does not belong to the tenant.

---

### `GET /api/clients/stats`
Returns aggregated client statistics, financial totals, and risk tier distribution for the tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Response: `200 OK`**:
```json
{
  "data": {
    "total_clients": 24,
    "total_outstanding": 18450.0,
    "total_recovered": 42100.0,
    "average_days_to_pay": 18,
    "risk_breakdown": {
      "low": 18,
      "medium": 4,
      "high": 2
    },
    "channel_breakdown": {
      "auto": 12,
      "email": 8,
      "sms": 2,
      "whatsapp": 2
    },
    "top_high_risk_clients": [
      {
        "id": 15,
        "name": "Apex Global Logistics",
        "company_name": "Apex Logistics Inc",
        "total_outstanding": 7500.0,
        "ai_late_risk_score": 85.5,
        "effective_channel": "whatsapp"
      }
    ]
  }
}
```

---

### `POST /api/clients/{id}/toggle-dnc`
1-Click toggle to switch a client between normal contact and **Do-Not-Contact (DNC)** status. When enabled (`do_not_contact: true`), all automated daily cron scans and manual reminders are blocked for this client.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Response: `200 OK`**:
```json
{
  "message": "Client marked as Do-Not-Contact. Automated and manual reminders are paused for this client.",
  "data": {
    "id": 1,
    "name": "Acme Corp Ltd",
    "do_not_contact": true,
    "updated_at": "2026-09-24T18:00:00.000000Z"
  }
}
```
*(If toggled back to `false`: `"message": "Client removed from Do-Not-Contact. Normal reminders resumed."`)*

---

## 6. Endpoint Reference: Duewise (Invoice Management, AI & Collections)

All endpoints under `/api/duewise/*` require an authenticated user (`Bearer <permanent_token>`) with active access to `duewise` (`subscribed:duewise` middleware), except public tracking routes (`/api/duewise/track/*`) and the OAuth2 callback route (`/api/duewise/quickbooks/callback`), which can be accessed without authentication to support browser redirects.

---

### 6.1 Dashboard & Cash Flow Forecast

#### `GET /api/duewise/dashboard`
Returns aggregated financial KPIs, status distribution, aging breakdown matrix (`current, 1-30, 31-60, 61-90, 90+`), and top overdue debtors.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "total_invoiced": 45000.0,
    "total_outstanding": 18500.0,
    "total_overdue": 12000.0,
    "total_recovered": 26500.0,
    "counts": {
      "total": 35,
      "paid": 20,
      "open": 8,
      "overdue": 5,
      "partially_paid": 2,
      "written_off": 0,
      "cancelled": 0,
      "draft": 0
    },
    "aging_buckets": {
      "current": { "count": 6, "amount": 6500.0 },
      "1-30": { "count": 3, "amount": 5000.0 },
      "31-60": { "count": 1, "amount": 4000.0 },
      "61-90": { "count": 1, "amount": 3000.0 },
      "90+": { "count": 0, "amount": 0.0 }
    },
    "top_overdue_clients": [
      {
        "client_id": 15,
        "client_name": "Apex Global Logistics",
        "company_name": "Apex Logistics Inc",
        "overdue_count": 2,
        "overdue_amount": 7000.0,
        "max_days_overdue": 45
      }
    ],
    "plan_limits": {
      "plan": "trial",
      "plan_name": "Free Trial",
      "is_trial": true,
      "can_create_invoice": true,
      "invoice_count": 8,
      "invoice_limit": 10,
      "invoices_remaining": 2,
      "can_use_email": true,
      "can_use_sms": false,
      "can_use_whatsapp": false,
      "can_use_smart_channel": false,
      "allowed_channels": ["email"],
      "cycle_start": "2026-09-19T00:00:00.000000Z",
      "cycle_end": "2026-09-26T00:00:00.000000Z",
      "upgrade_prompt": {
        "required": false,
        "target_plan": "base",
        "message": "Upgrade to Base plan to unlock 500 invoices/month, WhatsApp, SMS, and Smart Channel AI."
      }
    },
    "ai_briefing": {
      "generated_at": "2026-09-29T08:00:00+00:00",
      "cached": false,
      "cooldown_active": false,
      "portfolio_health": {
        "score": 85,
        "tier": "optimal",
        "label": "Optimal Cash Flow",
        "status_color": "#059669",
        "summary_metric": "92% on-schedule"
      },
      "briefing": {
        "headline": "🔮 DueWise AI Daily Briefing: 3 Overdue Invoices (1 Critical Exposure)",
        "executive_summary": "DueWise detected payment risk across 3 open invoices today. 1 invoice requires immediate attention (Apex Logistics, 22 days late) for which an escalated WhatsApp sequence is recommended. The remaining 2 invoices exhibit low delinquency risk and can be handled via routine courtesy follow-up. Approximately USD 45,000.00 is projected for recovery over the next 7 days (89% confidence).",
        "tone": "urgent",
        "engine": "gemini-ai"
      },
      "metrics": {
        "currency": "USD",
        "total_outstanding": 18500.0,
        "total_overdue": 12000.0,
        "overdue_count": 3,
        "high_risk_clients_count": 1,
        "projected_7d_recovery": 45000.0,
        "projected_30d_recovery": 88000.0,
        "pending_approvals_count": 2,
        "duewise_mode": "approval",
        "is_autopilot": false
      },
      "insights": [ ... ],
      "recommended_actions": [ ... ]
    }
  }
}
```

---

#### `GET /api/duewise/dashboard/ai-briefing`
Returns the **DueWise AI Daily Briefing & Cash Flow Intelligence Card**. Contains portfolio health score (0-100), natural language briefing synthesized in clean professional fintech English, key behavioral insights, and 1-click recommended actions.

> **Caching & Cost Protection**: Cached per tenant until midnight (`endOfDay`). A 5-minute cooldown is enforced for manual refresh (`?refresh=true`) to protect against token spam and excessive LLM billing.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:
  - `refresh` (`boolean`, optional): Force cache refresh and trigger Gemini generative synthesis if cooldown is inactive. Example: `?refresh=true`.
- **Response: `200 OK`**:
```json
{
  "data": {
    "generated_at": "2026-09-29T08:00:00+00:00",
    "cached": false,
    "cooldown_active": false,
    "portfolio_health": {
      "score": 85,
      "tier": "optimal",
      "label": "Optimal Cash Flow",
      "status_color": "#059669",
      "summary_metric": "92% on-schedule"
    },
    "briefing": {
      "headline": "🔮 DueWise AI Daily Briefing: 3 Overdue Invoices (1 Critical Exposure)",
      "executive_summary": "DueWise detected payment risk across 3 open invoices today. 1 invoice requires immediate attention (Apex Logistics, 22 days late) for which an escalated WhatsApp sequence is recommended. The remaining 2 invoices exhibit low delinquency risk and can be handled via routine courtesy follow-up. Approximately USD 45,000.00 is projected for recovery over the next 7 days (89% confidence).",
      "tone": "urgent",
      "engine": "gemini-ai"
    },
    "metrics": {
      "currency": "USD",
      "total_outstanding": 18500.0,
      "total_overdue": 12000.0,
      "overdue_count": 3,
      "high_risk_clients_count": 1,
      "projected_7d_recovery": 45000.0,
      "projected_30d_recovery": 88000.0,
      "pending_approvals_count": 2,
      "duewise_mode": "approval",
      "is_autopilot": false
    },
    "insights": [
      {
        "id": "insight_overdue_critical_101",
        "category": "risk_alert",
        "title": "Critical Delinquency Exposure Alert",
        "description": "Apex Logistics has an overdue balance of $8,500.00 (22 days past due, High Risk). Historical delay average: 35 days.",
        "urgency": "high",
        "metric_label": "Critical Delay",
        "metric_value": "22 days",
        "client_id": 15,
        "client_name": "Apex Logistics",
        "invoice_id": 101,
        "invoice_number": "INV-CRITICAL-01"
      },
      {
        "id": "insight_routine_overdue",
        "category": "risk_alert",
        "title": "Routine Low-Risk Overdue Accounts",
        "description": "2 open invoices ($3,000.00 total) are in early overdue stage (avg 3 days past due) with clean customer history. Handled via automated courtesy follow-up.",
        "urgency": "low",
        "metric_label": "Low-Risk Overdue",
        "metric_value": "2 invoices"
      },
      {
        "id": "insight_forecast_7d",
        "category": "cash_flow",
        "title": "7-Day Cash Flow Projection",
        "description": "AI predicts $45,000.00 in anticipated collections across the next 7 days based on client behavioral velocity.",
        "urgency": "info",
        "metric_label": "7-Day Inflow",
        "metric_value": "$45,000.00"
      },
      {
        "id": "insight_channel_opt_15",
        "category": "channel_optimization",
        "title": "Smart Channel Switch: WhatsApp",
        "description": "AI behavioral routing recommends WhatsApp for Apex Logistics to ensure highest read rate and prompt settlement.",
        "urgency": "medium",
        "metric_label": "Recommended Channel",
        "metric_value": "WhatsApp"
      }
    ],
    "recommended_actions": [
      {
        "id": "action_remind_high_101",
        "type": "quick_remind",
        "priority": "critical",
        "title": "Send AI WhatsApp Escalation",
        "description": "Escalate Apex Logistics for invoice INV-CRITICAL-01 (USD 8,500.00, 22 days late) using firm, urgent recovery tone.",
        "badge": "Critical Priority",
        "button_text": "Send WhatsApp Now",
        "api_endpoint": "/api/duewise/invoices/101/remind",
        "method": "POST",
        "payload": {
          "channel": "whatsapp",
          "tone": "firm"
        },
        "invoice_id": 101,
        "invoice_number": "INV-CRITICAL-01",
        "client_name": "Apex Logistics",
        "amount": 8500.0,
        "currency": "USD"
      },
      {
        "id": "action_remind_routine_102",
        "type": "quick_remind",
        "priority": "medium",
        "title": "Send Courtesy Email Reminder",
        "description": "Send friendly reminder to Beta Corp for invoice INV-ROUTINE-01 (USD 1,200.00) using polite courtesy tone.",
        "badge": "Routine Follow-up",
        "button_text": "Send Courtesy Email",
        "api_endpoint": "/api/duewise/invoices/102/remind",
        "method": "POST",
        "payload": {
          "channel": "email",
          "tone": "polite"
        },
        "invoice_id": 102,
        "invoice_number": "INV-ROUTINE-01",
        "client_name": "Beta Corp",
        "amount": 1200.0,
        "currency": "USD"
      },
      {
        "id": "action_review_approvals",
        "type": "review_approvals",
        "priority": "medium",
        "title": "Review 2 AI Reminders",
        "description": "Approve queued reminders with one click or view individual drafts.",
        "badge": "Pending Review",
        "button_text": "Approve All Reminders",
        "api_endpoint": "/api/duewise/reminders/approvals/approve-all",
        "method": "POST",
        "payload": [],
        "target_url": "/duewise/reminders/approvals"
      }
    ]
  }
}
```

---

#### `GET /api/duewise/entitlements`
Returns dedicated frontend-ready permission flags, cycle usage, and quota limits. Use this endpoint to directly toggle and disable UI buttons and reminder channel options in the frontend.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "plan": "trial",
    "plan_name": "Free Trial",
    "is_trial": true,
    "can_create_invoice": true,
    "invoice_count": 8,
    "invoice_limit": 10,
    "invoices_remaining": 2,
    "can_use_email": true,
    "can_use_sms": false,
    "can_use_whatsapp": false,
    "can_use_smart_channel": false,
    "allowed_channels": [
      "email"
    ],
    "cycle_start": "2026-09-19T00:00:00.000000Z",
    "cycle_end": "2026-09-26T00:00:00.000000Z",
    "upgrade_prompt": {
      "required": false,
      "target_plan": "base",
      "message": "Upgrade to Base plan to unlock 500 invoices/month, WhatsApp, SMS, and Smart Channel AI."
    }
  }
}
```

##### Frontend Key Reference:
| Key | Type | Description | Frontend UI Usage |
|---|---|---|---|
| `can_create_invoice` | `boolean` | `true` if tenant has quota remaining, `false` if limit reached (10 on trial or 500 on base). | `<button disabled={!can_create_invoice}>Create Invoice</button>` |
| `can_use_smart_channel` | `boolean` | `true` on Base / Big Books, `false` on trial. | Disable AI / Smart Channel auto-mode toggle |
| `can_use_whatsapp` | `boolean` | `true` on Base / Big Books, `false` on trial. | `<input type="radio" value="whatsapp" disabled={!can_use_whatsapp} />` |
| `can_use_sms` | `boolean` | `true` on Base / Big Books, `false` on trial. | `<input type="radio" value="sms" disabled={!can_use_sms} />` |
| `can_use_email` | `boolean` | `true` across all tiers. | Email option is always enabled |
| `invoice_count` | `integer` | Invoices created within current billing cycle / trial. | Displayed in usage progress bar (e.g. `8 / 10`) |
| `invoice_limit` | `integer \| null` | 10 for trial, 500 for Base, `null` for Big Books (unlimited). | Quota ceiling |
| `invoices_remaining` | `integer \| null` | Remaining invoices allowed before upgrade required. | Display remaining counter badge |
| `upgrade_prompt` | `object` | Indicates whether an upgrade prompt modal/banner should show. | Render upgrade banner |

---

#### `GET /api/duewise/forecast`
Projects incoming receivables over the next 30 days broken down into weekly buckets, day-by-day estimates, and 3 confidence scenarios (**Expected**, **Optimistic**, **Conservative**).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "forecast_period": {
      "start": "2026-09-10",
      "end": "2026-10-09",
      "days": 30
    },
    "summary": {
      "total_expected": 14250.0,
      "total_optimistic": 18500.0,
      "total_conservative": 9500.0,
      "total_at_risk": 3000.0
    },
    "weekly_buckets": {
      "days_1_7": {
        "period": "Days 1-7",
        "expected_amount": 4500.0,
        "invoice_count": 3
      },
      "days_8_14": {
        "period": "Days 8-14",
        "expected_amount": 5200.0,
        "invoice_count": 4
      },
      "days_15_21": {
        "period": "Days 15-21",
        "expected_amount": 3000.0,
        "invoice_count": 2
      },
      "days_22_30": {
        "period": "Days 22-30",
        "expected_amount": 1550.0,
        "invoice_count": 1
      },
      "beyond_30": {
        "period": "Beyond 30 Days (At Risk)",
        "expected_amount": 3000.0,
        "invoice_count": 1
      }
    },
    "daily_projections": [
      {
        "date": "2026-09-11",
        "expected_amount": 1500.0,
        "invoice_count": 1
      }
    ],
    "upcoming_payments": [
      {
        "invoice_id": 12,
        "invoice_number": "INV-2026-004",
        "client_name": "Acme Corp Ltd",
        "amount_due": 1500.0,
        "due_date": "2026-09-11",
        "predicted_date": "2026-09-11",
        "expected_amount": 1500.0,
        "late_probability": 15.0
      }
    ]
  }
}
```

---

### 6.2 Invoices CRUD & Operations

#### `GET /api/duewise/invoices`
Lists invoices belonging to the authenticated tenant. Supports filtering by client, status, aging bracket, and text search.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `client_id` | `integer` | Optional | Filter invoices by tenant client ID. |
| `status` | `string` | Optional | Filter by status: `draft`, `sent`, `viewed`, `partially_paid`, `paid`, `overdue`, `written_off`, `cancelled`. |
| `aging_bucket` | `string` | Optional | Filter by bracket: `current`, `1-30`, `31-60`, `61-90`, `90+`. |
| `search` | `string` | Optional | Searches invoice number or client name. |
| `per_page` | `integer` | Optional | Pagination limit (default: 15). |
| `page` | `integer` | Optional | Pagination page number. |

- **Response: `200 OK`**:
```json
{
  "data": [
    {
      "id": 101,
      "tenant_id": "tenant-abc12345",
      "client_id": 15,
      "number": "INV-2026-001",
      "currency": "usd",
      "issue_date": "2026-09-01",
      "due_date": "2026-09-15",
      "subtotal": 5000.0,
      "tax_total": 0.0,
      "total": 5000.0,
      "amount_paid": 0.0,
      "balance_due": 5000.0,
      "status": "sent",
      "days_overdue": 0,
      "aging_bucket": "current",
      "paid_at": null,
      "is_overdue_recovered": false,
      "recovered_at": null,
      "quickbooks_id": "QB-INV-5001",
      "ai_predicted_late_probability": 18.5,
      "ai_predicted_payment_date": "2026-09-15",
      "ai_prediction": {
        "probability": 18.5,
        "risk_tier": "low",
        "risk_label": "Low Delinquency Risk",
        "risk_color": "#10b981",
        "badge_text": "On-Schedule (18.5%)",
        "predicted_payment_date": "2026-09-15",
        "predicted_payment_date_formatted": "Sep 15, 2026",
        "estimated_delay_days": 0,
        "confidence_score": 95.0,
        "confidence_label": "95.0% Confidence",
        "risk_factors": [
          "Client maintains a 100% on-time payment track record."
        ],
        "summary_hover_text": "Predicted settlement: Sep 15, 2026 (95.0% confidence). Client maintains a 100% on-time payment track record.",
        "recommended_action": {
          "channel": "email",
          "channel_label": "Email",
          "tone": "polite",
          "action_text": "Send AI Email Reminder",
          "is_trial_restricted": false,
          "suggested_premium_channel": null,
          "api_endpoint": "/api/duewise/invoices/101/remind",
          "method": "POST",
          "payload": {
            "channel": "email",
            "tone": "polite"
          }
        }
      },
      "created_at": "2026-09-01T10:00:00.000000Z",
      "updated_at": "2026-09-01T10:00:00.000000Z"
    }
  ],
  "links": { ... },
  "meta": { ... }
}
```

---

#### `POST /api/duewise/invoices`
Creates a new invoice with line items. If QuickBooks Online is connected, the invoice is automatically synchronized to QuickBooks in real-time.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "client_id": 15,
  "number": "INV-2026-002",
  "currency": "usd",
  "issue_date": "2026-09-10",
  "due_date": "2026-09-24",
  "line_items": [
    {
      "description": "Custom Software Engineering Services",
      "quantity": 25,
      "unit_amount": 120.0,
      "tax_amount": 0.0
    },
    {
      "description": "Cloud Architecture Review",
      "quantity": 1,
      "unit_amount": 500.0,
      "tax_amount": 0.0
    }
  ],
  "metadata": {
    "project_id": "PRJ-99"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `client_id` | `integer` | **Yes** | Existing client ID belonging to the tenant. |
| `number` | `string` | Optional | Custom invoice number (auto-generated if omitted). |
| `currency` | `string` | Optional | 3-letter currency code (default: `'usd'`). |
| `issue_date` | `string` | Optional | Format: `YYYY-MM-DD` (defaults to today). |
| `due_date` | `string` | Optional | Format: `YYYY-MM-DD` (defaults to 14 days ahead). |
| `subtotal` | `number` | Optional | Automatically calculated from line items if omitted. |
| `tax_total` | `number` | Optional | Total tax amount (default: 0). |
| `total` | `number` | Optional | Automatically calculated as `subtotal + tax_total`. |
| `amount_paid` | `number` | Optional | Amount already settled (default: 0). |
| `line_items` | `array` | Optional | Array of line item objects. |
| `line_items.*.description` | `string` | **Yes** (if item sent) | Item description. |
| `line_items.*.quantity` | `number` | Optional | Quantity (default: 1). |
| `line_items.*.unit_amount` | `number` | **Yes** (if item sent) | Price per unit. |
| `line_items.*.tax_amount` | `number` | Optional | Tax amount for this item (default: 0). |
- **Response: `201 Created`**: Returns the complete created `InvoiceResource`.

##### Plan Limit Enforcement & Errors:
- **Trial Tenants**: Capped at **10 invoices** total during the free trial. Attempting to create an 11th invoice returns:
  ```json
  // Status: 403 Forbidden
  {
    "message": "Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create up to 500 invoices.",
    "error": "TRIAL_INVOICE_LIMIT_EXCEEDED",
    "current_count": 10,
    "limit": 10,
    "plan": "trial",
    "upgrade_url": "/billing/plans?product=duewise"
  }
  ```
- **Base Plan Tenants**: Capped at **500 invoices per billing cycle (month)**. Quota automatically refreshes when the billing month renews, or resets immediately if the user cancels and re-subscribes. Attempting to create a 501st invoice returns:
  ```json
  // Status: 403 Forbidden
  {
    "message": "You have reached the monthly limit of 500 invoices for the Base plan. Please upgrade to the Big Books plan for unlimited invoices.",
    "error": "PLAN_INVOICE_LIMIT_EXCEEDED",
    "current_count": 500,
    "limit": 500,
    "plan": "base",
    "cycle_start": "2026-09-19T00:00:00.000000Z",
    "upgrade_url": "/billing/plans?product=duewise"
  }
  ```
- **Big Books Plan Tenants**: Unlimited invoices.

---

#### `GET /api/duewise/invoices/{id}`
Returns a single invoice with its line items and client relationship loaded.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "id": 101,
    "tenant_id": "tenant-abc12345",
    "client_id": 15,
    "number": "INV-2026-002",
    "currency": "usd",
    "issue_date": "2026-09-10",
    "due_date": "2026-09-24",
    "subtotal": 3500.0,
    "tax_total": 0.0,
    "total": 3500.0,
    "amount_paid": 0.0,
    "balance_due": 3500.0,
    "status": "sent",
    "days_overdue": 0,
    "aging_bucket": "current",
    "is_overdue_recovered": false,
    "quickbooks_id": "QB-INV-5002",
    "ai_predicted_late_probability": 23.75,
    "ai_predicted_payment_date": "2026-09-28",
    "ai_prediction": {
      "probability": 23.75,
      "risk_tier": "low",
      "risk_label": "Low Delinquency Risk",
      "risk_color": "#10b981",
      "badge_text": "On-Schedule (23.75%)",
      "predicted_payment_date": "2026-09-28",
      "predicted_payment_date_formatted": "Sep 28, 2026",
      "estimated_delay_days": 0,
      "confidence_score": 94.8,
      "confidence_label": "94.8% Confidence",
      "risk_factors": [
        "Client historically paid late on 25% of previous invoices."
      ],
      "summary_hover_text": "Predicted settlement: Sep 28, 2026 (94.8% confidence). Client historically paid late on 25% of previous invoices.",
      "recommended_action": {
        "channel": "email",
        "channel_label": "Email",
        "tone": "polite",
        "action_text": "Send AI Email Reminder",
        "is_trial_restricted": false,
        "suggested_premium_channel": null,
        "api_endpoint": "/api/duewise/invoices/101/remind",
        "method": "POST",
        "payload": {
          "channel": "email",
          "tone": "polite"
        }
      }
    },
    "client": {
      "id": 15,
      "name": "Apex Global Logistics",
      "email": "billing@apexlogistics.com",
      "phone": "+15559876543"
    },
    "line_items": [
      {
        "id": 1,
        "description": "Custom Software Engineering Services",
        "quantity": 25,
        "unit_amount": 120.0,
        "total_amount": 3000.0
      },
      {
        "id": 2,
        "description": "Cloud Architecture Review",
        "quantity": 1,
        "unit_amount": 500.0,
        "total_amount": 500.0
      }
    ]
  }
}
```
- **Error: `404 Not Found`**: Returned if the invoice does not exist or belongs to another tenant.

---

#### `PUT /api/duewise/invoices/{id}`
Updates invoice fields. Recalculates totals and client risk metrics.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**: Same fields as `POST /api/duewise/invoices` (all optional).
- **Response: `200 OK`**: Returns the updated `InvoiceResource`.

---

#### `DELETE /api/duewise/invoices/{id}`
Soft-deletes or removes an invoice.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Invoice deleted successfully."
}
```

---

#### `POST /api/duewise/invoices/{id}/mark-as-paid`
Manual fallback to mark an invoice as paid. If the invoice was overdue (`days_overdue > 0`), it is automatically flagged for the **Monthly Recovery Fee** batch (`is_overdue_recovered: true`).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "amount": 3500.0,
  "paid_at": "2026-09-10",
  "payment_method": "wire_transfer",
  "notes": "Paid by client via wire reference #WR-9021."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | `number` | Optional | Amount paid (defaults to full `balance_due`). |
| `paid_at` | `string` | Optional | Payment date (defaults to current timestamp). |
| `payment_method` | `string` | Optional | e.g. `'wire_transfer'`, `'check'`, `'credit_card'`, `'quickbooks'`. |
| `notes` | `string` | Optional | Freeform payment notes. |

- **Response: `200 OK`**: Returns updated `InvoiceResource` with `status: "paid"` and `is_overdue_recovered: true`.

---

#### `POST /api/duewise/invoices/{id}/toggle-dnc`
1-Click toggle to set or remove **Do-Not-Contact (DNC)** status for a specific invoice. When an invoice has DNC enabled, daily automated reminder crons completely skip it.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Invoice marked as Do-Not-Contact. Automated and manual reminders are paused for this invoice.",
  "data": {
    "id": 101,
    "number": "INV-2026-002",
    "do_not_contact": true,
    "updated_at": "2026-09-24T18:00:00.000000Z"
  }
}
```
*(If toggled back to `false`: `"message": "Invoice removed from Do-Not-Contact. Normal reminders resumed."`)*

---

#### `GET /api/duewise/invoices/{id}/prediction`
Fetches AI payment delinquency risk probability, estimated payment date, confidence score, and explainable risk factors.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "probability": 68.5,
    "risk_tier": "medium",
    "risk_label": "Elevated Delinquency Risk",
    "risk_color": "#f59e0b",
    "badge_text": "Elevated Risk (68.5%)",
    "predicted_payment_date": "2026-09-28",
    "predicted_payment_date_formatted": "Sep 28, 2026",
    "estimated_delay_days": 14,
    "confidence_score": 86.3,
    "confidence_label": "86.3% Confidence",
    "risk_factors": [
      "Client historically paid late on 45% of previous invoices.",
      "Client broke 1 previously committed payment promise(s)."
    ],
    "summary_hover_text": "Predicted settlement: Sep 28, 2026 (86.3% confidence). Client historically paid late on 45% of previous invoices.",
    "recommended_action": {
      "channel": "email",
      "channel_label": "Email",
      "tone": "firm",
      "action_text": "Send Courtesy Email (WhatsApp unlocks on paid plan)",
      "is_trial_restricted": true,
      "suggested_premium_channel": "WhatsApp",
      "api_endpoint": "/api/duewise/invoices/101/remind",
      "method": "POST",
      "payload": {
        "channel": "email",
        "tone": "firm"
      }
    }
  }
}
```

---

#### `POST /api/duewise/invoices/{id}/predict`
Re-runs the AI late payment prediction algorithm and persists the scores (`ai_predicted_late_probability` and `ai_predicted_payment_date`) directly into the invoice record.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**: Returns the updated `InvoiceResource` containing the newly computed AI predictions.

---

#### `POST /api/duewise/invoices/{id}/remind`
Dispatches an instant collection reminder to the client. Uses OpenAI to craft dynamic tone-adjusted messaging (or deterministic fallback templates). Reminders initiated directly by a user from the invoice page bypass the outbound approval queue (`skip_approval: true`).

> **Twilio Platform Architecture**:
> All SMS and WhatsApp reminders are dispatched through the platform's centralized Twilio account (`TWILIO_ACCOUNT_SID`, `TWILIO_FROM_NUMBER`, `TWILIO_WHATSAPP_FROM`). Individual tenants do NOT need to configure their own Twilio or WhatsApp business accounts. Duewise automatically includes the tenant's business name in the reminder message body (e.g., *"This is a reminder from [Company Name] that Invoice #INV-2026-002 is due..."*) so clients instantly recognize the sender.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "channel": "auto",
  "tone": "polite",
  "custom_message": "Hi Apex Logistics, this is a friendly reminder that invoice #INV-2026-002 is due on Sep 24.",
  "force_dnc": false
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `channel` | `string` | Optional | `'auto'` (Smart Channel AI), `'email'`, `'sms'`, or `'whatsapp'`. Default: `'auto'`. |
| `tone` | `string` | Optional | Explicit reminder voice: `'polite'`, `'professional'`, or `'firm'`. If omitted, resolves automatically via hierarchy (`Client -> Tenant business_tone -> 'professional'`). |
| `custom_message` | `string` | Optional | Custom message override. If omitted, OpenAI AI Writer crafts the copy. |
| `force_dnc` | `boolean` | Optional | Set to `true` to deliberately override when client or invoice is on **Do-Not-Contact (DNC)**. Default: `false`. |

- **Response: `200 OK`**:
```json
{
  "message": "Payment reminder dispatched successfully via whatsapp.",
  "data": {
    "log_id": 14,
    "channel": "whatsapp",
    "recipient": "+15559876543",
    "status": "delivered",
    "tracking_token": "a1b2c3d4e5f67890123456789abcdef0"
  }
}
```

##### Trial Channel Restrictions & Errors:
- **Free Trial**: Reminders are strictly limited to **Email**.
  - If a trial user specifies `channel: "whatsapp"` or `channel: "sms"`, the API rejects the request with `403 Forbidden`:
    ```json
    // Status: 403 Forbidden
    {
      "message": "SMS and WhatsApp reminders are not available on the free trial. Please upgrade to the Base plan to unlock multi-channel reminders and Smart Channel AI.",
      "error": "TRIAL_CHANNEL_RESTRICTED",
      "requested_channel": "whatsapp",
      "allowed_channels": ["email"],
      "plan": "trial",
      "upgrade_url": "/billing/plans?product=duewise"
    }
    ```
  - If a trial user sends `channel: "auto"`, Duewise automatically resolves the channel strictly to `"email"` without error, ensuring automated follow-up sequences never break.
- **Base Plan & Big Books**: Unrestricted access to `email`, `sms`, `whatsapp`, and `auto` (Smart Channel AI).

##### Do-Not-Contact (DNC) Error:
- If a client or invoice has `do_not_contact: true` and the request does not provide `"force_dnc": true`, the reminder is blocked with `422 Unprocessable Content`:
  ```json
  // Status: 422 Unprocessable Content
  {
    "message": "Cannot send reminder: This client or invoice is marked as Do-Not-Contact. Pass 'force_dnc: true' to override.",
    "error": "DO_NOT_CONTACT_RESTRICTED",
    "is_dnc": true
  }
  ```

---

#### `GET /api/duewise/invoices/{id}/activity`
Returns the paginated chronological audit trail and communication log for this invoice (sent reminders, delivery events, email opens, payment link clicks, and client replies).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:
  - `page` (Optional, integer, default: `1`): Current page number.
  - `per_page` (Optional, integer, default: `15`, max: `100`): Number of records per page.
- **Response: `200 OK`**:
```json
{
  "data": [
    {
      "id": 14,
      "channel": "whatsapp",
      "recipient": "+15559876543",
      "status": "delivered",
      "tracking_token": "a1b2c3d4e5f6...",
      "sent_at": "2026-09-10T14:00:00.000000Z",
      "delivered_at": "2026-09-10T14:00:02.000000Z",
      "opened_at": "2026-09-10T14:15:20.000000Z",
      "clicked_at": "2026-09-10T14:16:05.000000Z",
      "replied_at": null
    }
  ],
  "current_page": 1,
  "per_page": 15,
  "total": 1,
  "last_page": 1
}
```

---

### 6.3 Outbound Approval Mode & Pending Queue

Duewise features a **30-Day Safeguard Window** designed to give new tenants full visibility and peace of mind before automation takes over:
1. **Approval Mode (Default for first 30 days)**: All daily automated milestone reminders are staged into a **Pending Approvals Queue** (`status: 'pending_approval'`) rather than dispatched immediately. The user can review, edit, approve individually, bulk-approve, or dismiss/reject reminders.
2. **Auto-Pilot Mode**: Automated reminders are dispatched directly to the client via Smart Channel AI (Email/SMS/WhatsApp) without requiring manual intervention.
3. **One-Click Graduation**: At any time, the user can click **"Switch to Auto-Pilot"** via the UI once they feel confident in the messaging. Conversely, they can switch back to **Approval Mode** at any time. After 30 days, tenants automatically graduate to Auto-Pilot unless explicitly kept in Approval Mode.

---

#### `GET /api/duewise/reminders/mode`
Fetches the tenant's current Duewise operational mode (`'approval'` or `'autopilot'`), remaining safeguard days, and count of pending outbound reminders.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "duewise_mode": "approval",
    "business_tone": "professional",
    "default_tone": "professional",
    "is_approval_mode": true,
    "is_autopilot": false,
    "approval_started_at": "2026-09-24T18:00:00.000000Z",
    "days_remaining": 30,
    "pending_approvals_count": 4
  }
}
```

---

#### `POST /api/duewise/reminders/mode`
Updates the operational mode to either `'approval'` or `'autopilot'`.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "mode": "autopilot"
}
```
| Parameter | Type | Required | Allowed Values |
|---|---|---|---|
| `mode` | `string` | **Yes** | `'approval'`, `'autopilot'`. |

- **Response: `200 OK`**:
```json
{
  "message": "Duewise mode successfully updated to autopilot.",
  "data": {
    "duewise_mode": "autopilot",
    "is_approval_mode": false,
    "is_autopilot": true,
    "days_remaining": 0
  }
}
```

---

#### `POST /api/duewise/reminders/enable-autopilot`
One-click shortcut action for the user to graduate immediately to Auto-Pilot.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Duewise Auto-Pilot enabled successfully. All automated reminders will now dispatch automatically without approval.",
  "data": {
    "duewise_mode": "autopilot",
    "is_approval_mode": false,
    "is_autopilot": true,
    "enabled_at": "2026-09-24T18:30:00.000000Z"
  }
}
```

---

#### `POST /api/duewise/reminders/enable-approval-mode`
One-click shortcut action to return the tenant to Outbound Approval Mode.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Duewise Outbound Approval Mode enabled successfully. Automated reminders will require manual approval before sending.",
  "data": {
    "duewise_mode": "approval",
    "is_approval_mode": true,
    "is_autopilot": false,
    "days_remaining": 30
  }
}
```

---

#### `GET /api/duewise/reminders/approvals`
Returns the paginated queue of automated reminders awaiting user review and approval before dispatch.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:
  - `page` (Optional, integer, default: `1`): Current page number.
  - `per_page` (Optional, integer, default: `15`, max: `100`): Items per page.
- **Response: `200 OK`**:
```json
{
  "data": [
    {
      "id": 42,
      "channel": "email",
      "recipient": "finance@clientcorp.test",
      "subject": "Friendly Reminder: Invoice #INV-2026-004 from Acme Corp",
      "body": "Hi John,\n\nWe hope you're having a productive week. Just a quick reminder that invoice #INV-2026-004 for $1,250.00 is due on Sep 28...",
      "status": "pending_approval",
      "queued_at": "2026-09-24T09:00:00.000000Z",
      "stage": "upcoming_due",
      "is_automated": true,
      "is_intent_nudge": false,
      "is_fallback": false,
      "invoice": {
        "id": 104,
        "number": "INV-2026-004",
        "total_amount": 1250.0,
        "balance_due": 1250.0,
        "currency": "usd",
        "due_date": "2026-09-28",
        "days_overdue": 0,
        "status": "open"
      },
      "client": {
        "id": 18,
        "name": "John Doe",
        "company_name": "Client Corp",
        "email": "finance@clientcorp.test",
        "phone": "+15552345678",
        "whatsapp_phone": "+15552345678"
      }
    }
  ],
  "links": {
    "first": "https://api.example.com/api/duewise/reminders/approvals?page=1",
    "last": "https://api.example.com/api/duewise/reminders/approvals?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "to": 1,
    "total": 1
  }
}
```

---

#### `POST /api/duewise/reminders/approvals/{id}/approve`
Approves a specific pending reminder and immediately dispatches it via its target channel (Email, SMS, or WhatsApp).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Payment reminder #42 approved and dispatched successfully via email.",
  "data": {
    "id": 42,
    "status": "delivered",
    "channel": "email",
    "recipient": "finance@clientcorp.test",
    "approved_at": "2026-09-24T18:45:00.000000Z"
  }
}
```

---

#### `POST /api/duewise/reminders/approvals/{id}/reject`
Dismisses a pending reminder from the outbound queue without sending it to the client.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "reason": "Client promised check payment in the mail."
}
```
| Parameter | Type | Required | Description |
|---|---|---|---|
| `reason` | `string` | Optional | Optional rejection or dismissal note. |

- **Response: `200 OK`**:
```json
{
  "message": "Payment reminder #42 rejected and dismissed.",
  "data": {
    "id": 42,
    "status": "rejected",
    "rejected_at": "2026-09-24T18:46:00.000000Z",
    "rejection_reason": "Client promised check payment in the mail."
  }
}
```

---

#### `POST /api/duewise/reminders/approvals/approve-all`
One-click bulk approval for all pending reminders currently in the tenant's outbound queue.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "Successfully approved and dispatched 4 pending reminder(s).",
  "approved_count": 4
}
```

---

### 6.4 Tone Control & AI Preview Copywriter

Duewise enables tenants to tailor the emotional resonance and authority of their payment reminders using a 3-tier hierarchy:
1. **Client Specific Override (`client.reminder_tone`)**: Can be set to `'polite'`, `'professional'`, or `'firm'`.
2. **Tenant Default Brand Voice (`tenant.business_tone`)**: Selected during Onboarding / Complete Profile, defaults to `'professional'`.
3. **System Fallback**: Defaults to `'professional'`.

#### AI Writer Integration (OpenAI API + Deterministic Fallback)
- **OpenAI Dynamic Copywriting**: When reminders are queued or dispatched, Duewise calls OpenAI using the configured tone and recipient channel.
  - **Email**: Detailed, brand-aligned body with invoice breakdown and payment link.
  - **SMS**: Strictly enforces character limit under **160 characters**.
  - **WhatsApp**: Formatted with markdown bolding (`*...*`), key invoice highlights, and emojis (`👋`, `⚠️`).
- **Resilient Fallback**: If `OPENAI_API_KEY` is unconfigured, rate-limited, or encounters a timeout, Duewise automatically generates rich, deterministic pre-built templates without throwing errors or interrupting collection workflows (`tone_source: "template"`).

---

#### `POST /api/duewise/reminders/tone-preview`
Generates a real-time preview of the reminder subject and body copy for an invoice before sending, allowing the user to experiment with different tones and channels. Does **not** send or log any communication.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "invoice_id": 104,
  "channel": "email",
  "tone": "polite",
  "stage": "upcoming_due"
}
```

| Parameter | Type | Required | Allowed Values |
|---|---|---|---|
| `invoice_id` | `integer` | **Yes** | Target invoice ID. |
| `channel` | `string` | Optional | `'email'`, `'sms'`, `'whatsapp'`. Default: `'email'`. |
| `tone` | `string` | Optional | `'polite'`, `'professional'`, `'firm'`. Default: client/tenant tone. |
| `stage` | `string` | Optional | Collection stage (e.g., `'upcoming_due'`, `'grace_period'`, `'overdue'`). |

- **Response: `200 OK`**:
```json
{
  "data": {
    "invoice_id": 104,
    "channel": "email",
    "tone": "polite",
    "stage": "upcoming_due",
    "subject": "Friendly Reminder: Invoice #INV-2026-004 from Acme Corp",
    "message": "Hi John,\n\nWe hope you're having a productive week! Just a gentle note that invoice #INV-2026-004 for $1,250.00 is due in 3 days...",
    "source": "ai"
  }
}
```
*(If OpenAI is unavailable, `"source": "template"` is returned).*

---

#### `POST /api/duewise/reminders/default-tone`
Updates the tenant's default reminder tone (`business_tone`).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "business_tone": "polite"
}
```
*(Accepts either `"business_tone"` or `"tone"`)*

- **Response: `200 OK`**:
```json
{
  "message": "Default reminder tone successfully updated to polite.",
  "data": {
    "business_tone": "polite",
    "default_tone": "polite"
  }
}
```

---

### 6.5 QuickBooks Online 2-Way Integration

#### `GET /api/duewise/quickbooks/connect`
Generates an Intuit OAuth2 authorization URL for connecting the tenant's QuickBooks Online company. Encrypts tenant identity, timestamp, and optional `redirect_uri` into the `state` parameter for CSRF security.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:
  - `redirect_uri` (Optional): Custom frontend callback URL (e.g. `http://localhost:5173/app/integrations`). If omitted, uses `.env` `QUICKBOOKS_REDIRECT_URI` or backend default.
- **Response: `200 OK`**:
```json
{
  "data": {
    "authorization_url": "https://appcenter.intuit.com/connect/oauth2?client_id=ABgkGV42...&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=...&state=..."
  }
}
```

---

#### `GET|POST /api/duewise/quickbooks/callback`
Exchanges the Intuit OAuth2 authorization `code` for access & refresh tokens and initiates historical customer/invoice sync. Can be invoked via **direct browser redirect (GET without Bearer token)** using the encrypted `state` parameter, or via **frontend SPA (POST with JSON body)**.

- **Auth Required**: Optional (Resolves tenant via Bearer token OR decrypts encrypted `state` token).
- **Request Parameters / Payload**:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `code` | `string` | **Yes** | Intuit OAuth2 authorization code (single-use). |
| `realmId` | `string` | **Yes** | QuickBooks Company / Realm ID. |
| `state` | `string` | **Yes** (if unauth) | Encrypted state string containing `tenant_id` and `redirect_uri`. |
| `redirect_uri` | `string` | Optional | Redirect URI that was used during `connect`. Extracted automatically from `state` if omitted. |

- **Response: `200 OK`**:
```json
{
  "message": "QuickBooks Online connected and initial sync triggered successfully.",
  "data": {
    "realm_id": "9341457883702448",
    "is_connected": true,
    "sync_status": "connected",
    "last_synced_at": null
  }
}
```
- **Errors**:
  - `400 Bad Request`: Token exchange error (e.g. expired code or Intuit error).
  - `403 Forbidden`: `Invalid or expired state parameter.`
  - `422 Unprocessable`: Missing `code` or `realmId`.

---

#### `GET /api/duewise/quickbooks/status`
Returns the tenant's current QuickBooks Online connection status.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "is_connected": true,
    "realm_id": "9341457883702448",
    "sync_status": "connected",
    "last_synced_at": "2026-09-10T14:30:00.000000Z"
  }
}
```

---

#### `POST /api/duewise/quickbooks/sync`
Triggers on-demand synchronization between QuickBooks and Duewise. Pulls new/updated customers (synced into `clients`), imports new invoices, and syncs payment statuses to trigger recovery fee qualifications.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "full": false
}
```
- **Response: `200 OK`**:
```json
{
  "message": "QuickBooks sync completed successfully.",
  "data": {
    "customers_synced": 12,
    "invoices_synced": 28,
    "payments_synced": 4
  }
}
```

---

#### `POST /api/duewise/quickbooks/disconnect`
Disconnects QuickBooks Online for the tenant and disables automated syncing.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "message": "QuickBooks disconnected successfully."
}
```

---

### 6.6 Unified Accounts & Integrations Status (QuickBooks Online + Stripe Connect)

Consolidates both QuickBooks Online sync state and Stripe Connect bank account connection status into a single, unified query. Frontends should prioritize calling this endpoint to power settings pages, dashboard integration widgets, and payout readiness banners rather than making multiple individual requests.

#### `GET /api/accounts/status` (or `GET /api/duewise/accounts/status`)

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: Optional / Open to all authenticated tenants (available on `/api/accounts/status` and within Duewise on `/api/duewise/accounts/status`).
- **Response: `200 OK`**:
```json
{
  "data": {
    "quickbooks": {
      "is_connected": true,
      "realm_id": "9341457883702448",
      "sync_status": "synced",
      "last_synced_at": "2026-09-10T14:30:00.000000Z"
    },
    "stripe": {
      "connected": true,
      "details_submitted": true,
      "charges_enabled": true,
      "payouts_enabled": true,
      "account_id": "acct_1UEaV9GfVjnx0zvm",
      "bank_name": "JPMorgan Chase Bank",
      "bank_last4": "6789"
    },
    "summary": {
      "quickbooks_connected": true,
      "stripe_connected": true,
      "payouts_enabled": true,
      "payouts_ready": true,
      "all_connected": true
    }
  }
}
```

#### Field Reference:

| Field Path | Type | Description |
|---|---|---|
| `data.quickbooks.is_connected` | `boolean` | `true` if active OAuth tokens exist and connection is valid. |
| `data.quickbooks.realm_id` | `string \| null` | QuickBooks Company / Realm ID. |
| `data.quickbooks.sync_status` | `string` | `'connected'`, `'synced'`, `'syncing'`, `'error'`, or `'not_connected'`. |
| `data.quickbooks.last_synced_at` | `string \| null` | ISO8601 timestamp of the last successful invoice/customer sync. |
| `data.stripe.connected` | `boolean` | `true` if tenant has submitted bank/payout onboarding details to Stripe. |
| `data.stripe.details_submitted` | `boolean` | `true` if tenant completed the Stripe Connect onboarding form. |
| `data.stripe.charges_enabled` | `boolean` | `true` if Stripe account can accept customer card payments. |
| `data.stripe.payouts_enabled` | `boolean` | `true` if payouts to the tenant's external bank account are active. |
| `data.stripe.account_id` | `string \| null` | Connected Stripe Express Account ID (`acct_...`). |
| `data.stripe.bank_name` | `string \| null` | Name of the verified payout bank or card brand. |
| `data.stripe.bank_last4` | `string \| null` | Last 4 digits of the attached external bank account. |
| `data.summary.quickbooks_connected` | `boolean` | Convenient boolean flag for QuickBooks readiness. |
| `data.summary.stripe_connected` | `boolean` | Convenient boolean flag for Stripe Connect bank readiness. |
| `data.summary.payouts_ready` | `boolean` | `true` when tenant can receive instant customer payouts into their bank. |
| `data.summary.all_connected` | `boolean` | `true` when BOTH QuickBooks and Stripe Connect are active and configured. |

> [!NOTE]
> **Component-Level Status Endpoints**:
> If a specific frontend component or modal only requires QuickBooks status, `GET /api/duewise/quickbooks/status` remains fully supported. Similarly, for Stripe-only views, `GET /api/billing/connect/status` remains available. Use `GET /api/accounts/status` whenever you need an overview of all third-party integrations.

---

### 6.7 Monthly Recovery Fee Engine (Base 15% vs Big Books 10%)

Platform charges a success fee only on **overdue amounts successfully recovered** each month. The fee is charged as a single monthly batch (never per invoice) to the tenant's payment card on file via Stripe.

- **Duewise Base Plan**: **15%** recovery fee.
- **Duewise Big Books Plan**: **10%** recovery fee.
- **Billing Currency**: Denominated in **USD**. If tenant invoices are issued and paid in other currencies (e.g. `PKR`, `EUR`, `GBP`), the system automatically converts them to USD at real-time cached exchange rates before calculating the 15%/10% fee.

> [!IMPORTANT]
> **System-Recovered Invoices Qualification Rule (QuickBooks Exclusion)**:
> Invoices only qualify for the recovery fee if **Duewise actively participated in the collection**:
> 1. Invoices imported from QuickBooks that were **already paid prior to sync** are strictly excluded (`is_overdue_recovered = false`).
> 2. For QuickBooks open invoices that later get paid, they qualify ONLY if Duewise actively followed up with reminders (Email/SMS/WhatsApp/Smart Channel with logged communications) or payment was collected via Duewise's Stripe Checkout link.
> 3. Invoices created natively inside Duewise that are settled past their due date automatically qualify.
>
> **Automated Month-End Cron Execution & Double-Billing Protection**:
> The scheduled cron job runs automatically on the **last day of every month at 23:55** (`duewise:process-monthly-recovery-fees`), aggregating all unbilled system-recovered overdue invoices and charging the fee via Stripe with full idempotency.
> Once billed, an invoice is stamped with `recovery_batch_id = <batch_id>`. This removes it from the unbilled `/current-cycle` queue permanently so it is **never billed twice**.

---

#### 6.7.1 Frontend Tab UI / Screen Specification ("Recovery Fees")

Frontend developers can build a dedicated **"Recovery Fees"** tab inside the Duewise or Billing navigation area.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  RECOVERY FEES                                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Top Section: Current Billing Cycle (Live Accruing Meter)]                            │
│  ┌──────────────────────────┬──────────────────────────┬─────────────────────────────┐ │
│  │ Current Plan             │ Overdue Recovered (Cycle)│ Est. Fee Accrued (To Bill)  │ │
│  │ Base (15% Rate)          │ $7.97 USD                │ $1.20 USD                   │ │
│  │ Period: Sept 01 - Sept 30│ (from 2,210 PKR)         │ Due at Month-End            │ │
│  └──────────────────────────┴──────────────────────────┴─────────────────────────────┘ │
│                                                                                        │
│  Pending Qualifying Invoices In This Cycle:                                            │
│  ┌───────────────┬──────────────────────┬──────────────┬───────────────┬────────────┐  │
│  │ Invoice #     │ Client               │ Original Amt │ Converted USD │ Recovered  │  │
│  ├───────────────┼──────────────────────┼──────────────┼───────────────┼────────────┤  │
│  │ INV-2026-013  │ TechCorp Pakistan    │ 2,210 PKR    │ $7.97 USD     │ Sept 22    │  │
│  └───────────────┴──────────────────────┴──────────────┴───────────────┴────────────┘  │
│  * Note: When invoices_count == 0, shows clean empty state:                            │
│    "All recovered invoices for this cycle have been billed, or no new overdue          │
│     invoices recovered yet."                                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Bottom Section: Monthly Billing Batches History]                                     │
│  ┌────────┬──────────────────────┬─────────────┬──────────────┬──────────┬───────────┐ │
│  │ Batch  │ Period               │ Recovered   │ Fee Charged  │ Status   │ Action    │ │
│  ├────────┼──────────────────────┼─────────────┼──────────────┼──────────┼───────────┤ │
│  │ #2     │ Sept 01 - Sept 30    │ $7.97 USD   │ $1.20 USD    │ [Charged]│ [View]    │ │
│  │ #1     │ Aug 01 - Aug 31      │ $50.00 USD  │ $7.50 USD    │ [Failed] │ [Retry]   │ │
│  └────────┴──────────────────────┴─────────────┴──────────────┴──────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

##### UI State Logic & Rules:
1. **Top Section (Current Cycle):**
   - Calls `GET /api/duewise/recovery-fee/current-cycle` on load.
   - If `data.invoices_count > 0`: Display the metric cards and the qualifying invoices table showing original currency & USD converted value.
   - If `data.invoices_count === 0`: Display a subtle info card stating that no unbilled overdue recoveries are pending for this cycle.
2. **Bottom Section (Batches History):**
   - Calls `GET /api/duewise/recovery-fee/batches?page=1&per_page=15`.
   - **Status Badges**:
     - `charged` -> Green badge (`bg-green-100 text-green-800`).
     - `failed` -> Red badge (`bg-red-100 text-red-800`).
   - **Retry Button**:
     - Display a prominent **"Retry Payment"** button ONLY when `batch.can_retry === true` (`status === 'failed'`).
     - Clicking triggers `POST /api/duewise/recovery-fee/batches/{id}/retry`.
     - Disable button and show a spinner while retrying.
     - On success (`200 OK`): Show toast *"Payment retried successfully"* and re-fetch batches.
     - On failure (`422 Unprocessable Entity`): Show toast error (e.g. *"Card declined"*).
   - **Batch Details Modal (Optional):**
     - Clicking `[View Details]` opens a dialog displaying `batch.metadata.invoices_breakdown` (listing all invoices that made up the batch, original currencies, and exchange rates).

---

#### 6.5.2 Endpoint Reference

#### `GET /api/duewise/recovery-fee/current-cycle`
Inspects live unbilled overdue recoveries in the current calendar month that are queued to be billed at month-end.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK` (With Pending Unbilled Invoices)**:
```json
{
  "data": {
    "current_plan": "base",
    "fee_percentage": 15.0,
    "period_start": "2026-09-01",
    "period_end": "2026-09-30",
    "total_overdue_recovered": 7.97,
    "accrued_recovery_fee": 1.20,
    "currency": "usd",
    "invoices_count": 1,
    "qualifying_invoices": [
      {
        "id": 43,
        "number": "INV-2026-013",
        "client_name": "Apex Global Logistics",
        "currency": "pkr",
        "amount_recovered": 2210.0,
        "amount_recovered_usd": 7.97,
        "recovered_at": "2026-09-22T00:00:00.000000Z",
        "due_date": "2026-09-20",
        "paid_at": "2026-09-22T00:00:00.000000Z"
      }
    ]
  }
}
```

- **Response: `200 OK` (When All Recoveries are Billed / Clean State)**:
```json
{
  "data": {
    "current_plan": "base",
    "fee_percentage": 15.0,
    "period_start": "2026-09-01",
    "period_end": "2026-09-30",
    "total_overdue_recovered": 0,
    "accrued_recovery_fee": 0,
    "currency": "usd",
    "invoices_count": 0,
    "qualifying_invoices": []
  }
}
```

---

#### `GET /api/duewise/recovery-fee/batches`
Returns historical recovery billing batches charged to the tenant's default card via Stripe with pagination support.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Query Parameters**:
  - `page` (Optional, integer, default: `1`): Current page number.
  - `per_page` (Optional, integer, default: `15`, max: `100`): Number of records per page.
- **Response: `200 OK`**:
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 2,
      "tenant_id": "tenant-iyk9oxfa",
      "period_start": "2026-09-01T00:00:00.000000Z",
      "period_end": "2026-09-30T00:00:00.000000Z",
      "plan_key": "base",
      "total_recovered_amount": "7.97",
      "fee_percentage": "15.00",
      "fee_amount": "1.20",
      "currency": "usd",
      "performance_fee_id": 2,
      "status": "charged",
      "charged_at": "2026-09-22T18:48:14.000000Z",
      "can_retry": false,
      "metadata": {
        "invoice_count": 1,
        "invoice_ids": [43],
        "invoices_breakdown": [
          {
            "id": 43,
            "number": "INV-2026-013",
            "currency": "pkr",
            "amount_recovered": 2210.0,
            "amount_recovered_usd": 7.97
          }
        ],
        "currency_conversion": {
          "target_currency": "usd",
          "rates": {
            "USD": 1.0,
            "PKR": 277.425913,
            "EUR": 0.87176,
            "GBP": 0.747749
          }
        }
      },
      "created_at": "2026-09-22T18:48:14.000000Z",
      "updated_at": "2026-09-22T18:48:14.000000Z"
    },
    {
      "id": 1,
      "tenant_id": "tenant-iyk9oxfa",
      "period_start": "2026-08-01T00:00:00.000000Z",
      "period_end": "2026-08-31T00:00:00.000000Z",
      "plan_key": "base",
      "total_recovered_amount": "50.00",
      "fee_percentage": "15.00",
      "fee_amount": "7.50",
      "currency": "usd",
      "performance_fee_id": null,
      "status": "failed",
      "charged_at": null,
      "can_retry": true,
      "metadata": {
        "invoice_count": 1,
        "invoice_ids": [28]
      },
      "created_at": "2026-09-01T00:05:00.000000Z",
      "updated_at": "2026-09-01T00:05:00.000000Z"
    }
  ],
  "first_page_url": "http://localhost:8000/api/duewise/recovery-fee/batches?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "http://localhost:8000/api/duewise/recovery-fee/batches?page=1",
  "next_page_url": null,
  "path": "http://localhost:8000/api/duewise/recovery-fee/batches",
  "per_page": 15,
  "prev_page_url": null,
  "to": 2,
  "total": 2
}
```

---

#### `POST /api/duewise/recovery-fee/batches/{id}/retry`
Manually re-attempts charging a failed monthly performance recovery fee batch to the tenant's card on file.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **URL Parameters**:
  - `id` (Required, integer): The ID of the failed recovery batch.
- **Validation / Preconditions**:
  - The batch must belong to the authenticated tenant.
  - The batch must have `status === 'failed'`.
- **Response: `200 OK` (Payment Retried Successfully)**:
```json
{
  "message": "Recovery fee payment retried successfully.",
  "data": {
    "id": 1,
    "tenant_id": "tenant-iyk9oxfa",
    "period_start": "2026-08-01T00:00:00.000000Z",
    "period_end": "2026-08-31T00:00:00.000000Z",
    "plan_key": "base",
    "total_recovered_amount": "50.00",
    "fee_percentage": "15.00",
    "fee_amount": "7.50",
    "currency": "usd",
    "performance_fee_id": 18,
    "status": "charged",
    "charged_at": "2026-09-23T00:15:00.000000Z",
    "can_retry": false,
    "metadata": {
      "invoice_count": 1,
      "invoice_ids": [28],
      "retried_at": "2026-09-23T00:15:00.000000Z",
      "retried_successfully": true
    }
  }
}
```
- **Response: `422 Unprocessable Entity` (Card Declined / Payment Failed)**:
```json
{
  "message": "Payment retry failed: Your card was declined.",
  "error": "PAYMENT_FAILED"
}
```
- **Response: `422 Unprocessable Entity` (Invalid Batch Status)**:
```json
{
  "message": "Only failed batches can be retried. Current status is [charged].",
  "error": "INVALID_STATUS"
}
```
- **Response: `404 Not Found`**:
```json
{
  "message": "Recovery fee batch [999] not found.",
  "error": "NOT_FOUND"
}
```

---

### 6.8 Public Communication Tracking (No Auth)

#### `GET /api/duewise/track/open/{token}`
Tracking pixel embedded in reminder HTML emails (`<img src="/api/duewise/track/open/{token}" width="1" height="1" />`).
- **Auth Required**: None (Public).
- **Behavior**: Records the `opened_at` timestamp on the communication log and returns an HTTP `200 OK` with binary `image/gif` content (1x1 transparent GIF).

#### `GET /api/duewise/track/click/{token}?url=...`
Click tracking redirect inserted into SMS/WhatsApp and email links.
- **Auth Required**: None (Public).
- **Query Parameter**: `url` (URL-encoded destination link).
- **Behavior**: Records the `clicked_at` timestamp on the communication log and responds with an HTTP `302 Found` redirect to the destination `url`.

---

### 6.9 Public Invoice Payment Portal & Stripe Checkout (No Auth / Client Facing)

#### `GET /pay/{id}`
Public checkout summary page rendered for the client after clicking the "Pay Invoice" button in email/SMS/WhatsApp.
- **Auth Required**: None (Public).
- **Behavior**:
  - If the invoice is already settled, renders an **Invoice Already Paid** receipt.
  - If unpaid, displays invoice metadata, line items table, balance due, and a **"Pay with Card / Stripe"** action button.

#### `POST /pay/{id}/checkout`
Initiates a secure Stripe Checkout Session.
- **Auth Required**: None (Public).
- **Behavior**:
  - Automatically creates a Stripe Checkout Session for the invoice's `balance_due`.
  - Attaches metadata: `type: "duewise_invoice_payment"`, `invoice_id`, `tenant_id`.
  - Payout destination: If the tenant has a connected Stripe account (`stripe_connect_id`), Stripe routes the funds directly to the tenant's connected bank account via `transfer_data.destination`.
  - Issues an HTTP 302 redirect to the Stripe-hosted checkout page.

#### `GET /pay/{id}/success`
Confirmation receipt page displayed to the client upon successful completion of payment on Stripe.
- **Auth Required**: None (Public).

#### Stripe Webhook Signal (`checkout.session.completed`)
When Stripe processes the payment successfully, Stripe sends a webhook to `POST /api/stripe/webhook`:
1. System identifies the payment via `metadata.type === 'duewise_invoice_payment'`.
2. Marks the invoice `status = 'paid'`, `amount_paid = total`, and `balance_due = 0`.
3. If the invoice was overdue past its due date, automatically sets `is_overdue_recovered = true` and `recovered_at = now()`.
4. The existing `duewise:process-monthly-recovery-fees` engine includes this recovered invoice in the month-end performance fee batch (15% Base / 10% Big Books).

---

## 7. Endpoint Reference: Billing & Subscriptions

### `GET /api/billing/plans`
Fetches the catalog of products, active plans, pricing, features, and the authenticated tenant's current trial and subscription state per product. Use this unified endpoint to populate pricing comparison tables, plan selectors, and dynamic trial countdown banners in the frontend.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Query Parameters**:
  - `product` (Optional): Filter plans for a specific product slug (e.g. `?product=duewise`). If omitted, returns all 10 products and their active plans.

#### Response: `200 OK`
```json
{
  "data": [
    {
      "product": "duewise",
      "product_name": "Duewise",
      "trial_enabled": true,
      "trial_days": 7,
      "is_subscribed": false,
      "on_trial": true,
      "trial_ends_at": "2026-09-16T03:00:00.000000Z",
      "current_plan": "base",
      "current_subscription": {
        "stripe_id": "sub_123456789",
        "stripe_status": "trialing",
        "stripe_price": "price_duewise_base",
        "plan_key": "base",
        "on_trial": true,
        "trial_ends_at": "2026-09-16T03:00:00.000000Z",
        "ends_at": null,
        "cancel_at_period_end": false
      },
      "plans": [
        {
          "id": 1,
          "plan_key": "base",
          "name": "Base Plan",
          "description": "Standard Duewise plan with automated follow-ups",
          "flat_amount": 299.0,
          "currency": "USD",
          "billing_interval": "month",
          "trial_days": 7,
          "performance_fee_percent": 15.0,
          "features": [
            "Smart multi-channel invoice sequences",
            "Up to 500 active invoices",
            "Email & WhatsApp delivery",
            "Real-time recovery tracking"
          ],
          "metadata": null,
          "is_active": true,
          "sort_order": 1
        },
        {
          "id": 2,
          "plan_key": "big_books",
          "name": "Big Books Plan",
          "description": "High volume accounts with dedicated AI follow-ups",
          "flat_amount": 499.0,
          "currency": "USD",
          "billing_interval": "month",
          "trial_days": 7,
          "performance_fee_percent": 10.0,
          "features": [
            "Unlimited active invoices",
            "Custom sequence scheduling",
            "Dedicated phone & WhatsApp channels",
            "Priority AI risk analysis"
          ],
          "metadata": null,
          "is_active": true,
          "sort_order": 2
        }
      ]
    }
  ]
}
```

---

### `GET /api/billing/transactions`
Retrieves a paginated list of billing transactions for the authenticated tenant (subscription recurring charges, trial starts, performance fee charges, usage invoices). Strict tenant isolation is enforced.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Query Parameters**:
  - `product` (Optional): Filter by product slug (e.g. `?product=duewise`).
  - `type` (Optional): Filter by transaction type (`trial_start`, `subscription`, `performance_fee`, `usage`, `refund`).
  - `status` (Optional): Filter by status (`succeeded`, `pending`, `failed`, `refunded`).
  - `per_page` (Optional): Integer between 1 and 100 (Default: `15`).
  - `page` (Optional): Page number for pagination.

#### Response: `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "tenant-b7e19f2a",
      "product": "duewise",
      "type": "trial_start",
      "description": "7-day free trial started for Duewise (base)",
      "amount": 0.0,
      "currency": "USD",
      "status": "succeeded",
      "stripe_invoice_id": null,
      "stripe_payment_intent_id": null,
      "stripe_subscription_id": "sub_1Q2w3e4r...",
      "paid_at": "2026-09-09T03:00:00.000000Z",
      "receipt_url": null,
      "metadata": {
        "plan": "base",
        "trial_days": 7
      },
      "created_at": "2026-09-09T03:00:00.000000Z"
    },
    {
      "id": 2,
      "tenant_id": "tenant-b7e19f2a",
      "product": "duewise",
      "type": "performance_fee",
      "description": "15% performance fee on $5000 recovered for Invoice INV-001",
      "amount": 750.0,
      "currency": "USD",
      "status": "pending",
      "stripe_invoice_id": "in_1Q2w3e4r...",
      "stripe_payment_intent_id": null,
      "stripe_subscription_id": null,
      "paid_at": null,
      "receipt_url": null,
      "metadata": {
        "plan": "base",
        "recovered_amount": 5000
      },
      "created_at": "2026-09-09T03:15:00.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/billing/transactions?page=1",
    "last": "http://localhost:8000/api/billing/transactions?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [],
    "path": "http://localhost:8000/api/billing/transactions",
    "per_page": 15,
    "to": 2,
    "total": 2
  }
}
```

---

### `POST /api/billing/setup-intent`
Generates a Stripe `SetupIntent` with `client_secret` so the frontend can securely initialize Stripe Elements (or Payment Element) to collect card details and handle 3D Secure / SCA cardholder authentication on the frontend if required by the customer's bank.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Request Body**: None (empty JSON `{}`)

#### Response: `200 OK`
```json
{
  "message": "Setup intent created successfully.",
  "data": {
    "client_secret": "seti_1P2w3e4r5t6y7u8i_secret_AbCdEf123456"
  }
}
```

---

### `GET /api/billing/payment-methods`
Fetches all saved payment methods (cards) attached to the authenticated tenant's Stripe customer account.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Response: `200 OK`
```json
{
  "data": [
    {
      "id": "pm_1P2w3e4r5t6y7u8i",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2028,
      "funding": "credit",
      "is_default": true
    }
  ]
}
```
*(If tenant has no cards saved yet, returns `"data": []`)*

---

### `POST /api/billing/payment-methods`
Attaches a card (Stripe PaymentMethod) to the tenant's Stripe customer account, optionally marks it as default, updates the tenant's cached `pm_type` & `pm_last_four`, and returns the card details.

> [!TIP]
> Frontend can create the `payment_method` ID (`pm_...`) using either:
> 1. `stripe.createPaymentMethod({ type: 'card', card: cardElement })`
> 2. `stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardElement } })`

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Request Body
```json
{
  "payment_method": "pm_1P2w3e4r5t6y7u8i",
  "set_as_default": true,
  "billing_email": "billing@acmelaw.com"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `payment_method` | `string` | **Yes** | Stripe PaymentMethod ID (`pm_...`) generated by Stripe.js on the frontend. |
| `set_as_default` | `boolean` | Optional | Set to `true` (default) to make this the primary card for subscriptions & performance fees. |
| `billing_email` | `string` | Optional | Updates tenant billing email if provided. |

#### Response: `201 Created`
```json
{
  "message": "Payment method added successfully.",
  "data": {
    "id": "pm_1P2w3e4r5t6y7u8i",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2028,
    "funding": "credit",
    "is_default": true
  }
}
```

---

### `DELETE /api/billing/payment-methods/{id}`
Detaches / deletes a saved card from the tenant's Stripe customer account.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **URL Parameter**: `id` — The Stripe PaymentMethod ID (`pm_...`) to delete.

#### Response: `200 OK`
```json
{
  "message": "Payment method deleted successfully."
}
```

---

### `GET /api/billing/subscription`
Checks current subscription and 7-day trial status for the tenant for a specific product. Subscriptions are strictly per-product; there is no platform-wide subscription fee.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Query Parameters**:
  - `product` (**Required**): Product slug (e.g. `?product=duewise`).

#### Response: `200 OK`
```json
{
  "product": "duewise",
  "subscribed": false,
  "on_trial": true,
  "subscription": null
}
```
*(When subscribed, `subscription` returns `{ id, stripe_id, stripe_status, stripe_price, type, ends_at }`)*

---

### `POST /api/billing/subscribe`
Subscribes the tenant to a recurring product plan using a Stripe payment method ID.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Request Body
```json
{
  "product": "duewise",
  "plan": "base",
  "payment_method": "pm_card_visa",
  "billing_email": "billing@acmelaw.com"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | `string` | **Yes** | Product slug (e.g. `'duewise'`, `'ledgercrew'`). |
| `plan` | `string` | **Yes** | Plan slug under the product (e.g. `'base'`, `'big_books'`). |
| `payment_method` | `string` | Optional* | Stripe Payment Method ID (`pm_...`). *Optional if the tenant has already saved a card via `POST /api/billing/payment-methods`. Required if tenant has no saved card. |
| `billing_email` | `string` | Optional | Overrides tenant billing email if provided. |

#### Response: `201 Created`
```json
{
  "data": {
    "id": 1,
    "stripe_id": "sub_1Q2w3e4r...",
    "stripe_status": "active",
    "stripe_price": "price_1Q2w...",
    "type": "duewise",
    "ends_at": null
  },
  "message": "Subscribed successfully."
}
```

---

### `POST /api/billing/cancel`
Cancels an active subscription (at period end or immediately).

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Request Body
```json
{
  "product": "duewise",
  "immediately": false
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | `string` | **Yes** | Product slug to cancel (e.g. `'duewise'`). Subscriptions are strictly per-product. |
| `immediately` | `boolean` | Optional | If `true`, cancels immediately; if `false` (default), cancels at end of current period. |

#### Response: `200 OK`
```json
{
  "data": {
    "id": 1,
    "stripe_id": "sub_1Q2w3e4r...",
    "stripe_status": "active",
    "ends_at": "2026-10-08T18:00:00.000000Z"
  },
  "message": "Subscription cancelled."
}
```

---

### `POST /api/billing/performance-fees`
Calculates and charges a performance fee for recovered invoice funds via Stripe invoice item.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Request Body
```json
{
  "recovered_amount": 5000,
  "product": "duewise",
  "plan": "base",
  "description": "15% performance fee on $5000 recovered for Invoice INV-001"
}
```

#### Response: `201 Created`
```json
{
  "message": "Performance fee added as Stripe invoice item.",
  "data": {
    "id": 1,
    "recovered_amount": 5000,
    "fee_amount": 750,
    "fee_percentage": 15.0
  }
}
```

---

### `POST /api/billing/connect/onboard`
Generates a Stripe Connect Express onboarding URL for the tenant to connect their bank account/routing details so client invoice payments transfer directly to them.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Request Body**:
```json
{
  "return_url": "http://localhost:5173/app/settings/payouts?status=success",
  "refresh_url": "http://localhost:5173/app/settings/payouts?status=refresh"
}
```

#### Response: `200 OK`
```json
{
  "url": "https://connect.stripe.com/setup/s/acct_123456789/AbCdEfGhIjKl",
  "account_id": "acct_123456789",
  "message": "Stripe Connect onboarding link generated successfully."
}
```

---

### `GET /api/billing/connect/status`
Retrieves the tenant's current Stripe Connect bank account attachment status.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Response: `200 OK`
```json
{
  "connected": true,
  "details_submitted": true,
  "charges_enabled": true,
  "payouts_enabled": true,
  "account_id": "acct_123456789",
  "bank_name": "JPMorgan Chase Bank",
  "bank_last4": "6789"
}
```

---

### `GET /api/billing/connect/login-link`
Generates a single-use login link to the tenant's Stripe Express Payout Dashboard.

- **Auth Required**: Yes (`Bearer <permanent_token>`)

#### Response: `200 OK`
```json
{
  "url": "https://connect.stripe.com/express/acct_123456789/..."
}
```

---

### Product & Plan Catalog

Use these exact slugs when calling `/api/billing/subscribe`:

| Product Slug | Product Name | Available Plans | Plan Details |
|---|---|---|---|
| `duewise` | Duewise | `'base'` | $299/mo + 15% performance fee |
| | | `'big_books'` | $499/mo + 10% performance fee |
| `ledgercrew` | LedgerCrew | `'tier1'`, `'tier2'`, `'tier3'` | $299/mo, $449/mo, $599/mo |
| `savescout` | SaveScout | `'default'` | Usage-based performance fees |
| `hirecredits` | HireCredits | `'standard'`, `'premium'` | $299/mo, $499/mo ($75 cert fee) |
| `ringready` | RingReady | `'starter'`, `'growth'`, `'scale'` | $299/mo, $499/mo, $899/mo |
| `claimnest` | ClaimNest | `'starter'`, `'growth'`, `'scale'` | $349/mo, $599/mo, $899/mo + 12% fee |
| `replyfirst` | ReplyFirst | `'starter'`, `'pro'` | $297/mo, $497/mo |
| `rebookhq` | RebookHQ | `'retainer'`, `'performance'` | $349/mo or 25% recovery fee |
| `renewdesk` | RenewDesk | `'starter'`, `'growth'`, `'scale'` | $99/mo, $199/mo, $249/mo |
| `certchase` | CertChase | `'base'` | $199/mo |

---

## 8. Standard Error Responses

The backend standardizes all JSON errors across controllers and domain exceptions:

### 1. Validation Errors (`422 Unprocessable Content`)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email has already been taken."
    ],
    "password": [
      "The password field must be at least 8 characters."
    ]
  }
}
```

### 2. Domain Exceptions (`400`, `401`, `402`, `403`, `404`)
```json
{
  "message": "Human readable error message.",
  "error": "ErrorClassName"
}
```

Common Domain Error Codes:
- `InvalidCredentialsException` (400): Email/password mismatch.
- `InvalidTokenException` (401 / 403): Token expired, invalid, or temporary token used on protected endpoint.
- `TrialExpiredException` (402): 7-day trial expired; requires active Stripe subscription for the requested product.
- `ProfileAlreadyCompletedException` (400): Attempted to re-submit `/api/complete-profile`.
- `ClientNotFoundException` (404): Client ID not found for this tenant.
- `InvalidOtpException` (422): OTP code incorrect or expired.
- `TooManyOtpRequestsException` (429): Resend OTP cooldown active (wait 60 seconds).

---

## 9. Complete TypeScript Definitions

Copy and paste these definitions into your frontend project (e.g. `src/types/api.d.ts`):

```typescript
export interface Tenant {
  id: string;
  name: string | null;
  business_type: string | null;
  business_category: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  website: string | null;
  tax_id: string | null;
  business_tone?: 'polite' | 'professional' | 'firm';
  trial_ends_at: string | null;
  on_trial: boolean;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  tenant_id: string;
  roles: string[];
  email_verified_at: string | null;
  is_profile_complete: boolean;
  created_at?: string;
  updated_at?: string;
  tenant?: Tenant | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  token_type: 'Bearer';
  is_temporary: boolean;
}

export interface CheckEmailResponse {
  email: string;
  is_registered: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  verified: boolean;
  user: User;
  token: string;
  token_type: 'Bearer';
  is_temporary: false;
}

export interface Client {
  id: number;
  tenant_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  currency: string | null;
  tax_number: string | null;
  address: string | null;
  preferred_channel: 'email' | 'sms' | 'whatsapp' | 'call' | null;
  ai_recommended_channel: string | null;
  effective_channel: string | null;
  do_not_contact: boolean;
  reminder_tone?: 'polite' | 'professional' | 'firm' | null;
  resolved_tone: 'polite' | 'professional' | 'firm';
  ai_late_risk_score: number;
  risk_tier: 'low' | 'medium' | 'high' | null;
  average_days_to_pay: number;
  total_invoices_count: number;
  late_invoices_count: number;
  total_outstanding: number;
  total_recovered: number;
  quickbooks_id: string | null;
  quickbooks_synced_at: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_amount: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface Invoice {
  id: number;
  tenant_id: string;
  client_id: number;
  number: string;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'written_off' | 'cancelled';
  days_overdue: number;
  aging_bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  paid_at: string | null;
  is_overdue_recovered: boolean;
  recovered_at: string | null;
  do_not_contact: boolean;
  quickbooks_id: string | null;
  ai_predicted_late_probability: number | null;
  ai_predicted_payment_date: string | null;
  ai_prediction?: InvoiceAiPrediction | null;
  client?: Client;
  line_items?: InvoiceLineItem[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceAiPrediction {
  probability: number;
  risk_tier: 'low' | 'medium' | 'high' | 'settled';
  risk_label: string;
  risk_color: string;
  badge_text: string;
  predicted_payment_date: string | null;
  predicted_payment_date_formatted: string | null;
  estimated_delay_days: number;
  confidence_score: number;
  confidence_label: string;
  risk_factors: string[];
  summary_hover_text: string;
  recommended_action: {
    channel: 'email' | 'sms' | 'whatsapp';
    channel_label: string;
    tone: 'polite' | 'professional' | 'firm';
    action_text: string;
    is_trial_restricted: boolean;
    suggested_premium_channel: string | null;
    api_endpoint: string;
    method: 'POST';
    payload: {
      channel: string;
      tone: string;
    };
  } | null;
}

export interface DuewiseModeResponse {
  duewise_mode: 'approval' | 'autopilot';
  business_tone: 'polite' | 'professional' | 'firm';
  default_tone: 'polite' | 'professional' | 'firm';
  is_approval_mode: boolean;
  is_autopilot: boolean;
  approval_started_at: string;
  days_remaining: number;
  pending_approvals_count: number;
}

export interface OutboundApprovalItem {
  id: number;
  channel: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject: string | null;
  body: string;
  status: 'pending_approval' | 'delivered' | 'rejected';
  queued_at: string;
  stage: string | null;
  is_automated: boolean;
  is_intent_nudge: boolean;
  is_fallback: boolean;
  invoice: {
    id: number;
    number: string;
    total_amount: number;
    balance_due: number;
    currency: string;
    due_date: string | null;
    days_overdue: number;
    status: string;
  } | null;
  client: {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    whatsapp_phone: string | null;
  } | null;
}

export interface TonePreviewRequest {
  invoice_id: number;
  channel?: 'email' | 'sms' | 'whatsapp';
  tone?: 'polite' | 'professional' | 'firm';
  stage?: string;
}

export interface TonePreviewResponse {
  invoice_id: number;
  channel: 'email' | 'sms' | 'whatsapp';
  tone: 'polite' | 'professional' | 'firm';
  stage: string | null;
  subject: string | null;
  message: string;
  source: 'ai' | 'template';
}

export interface InvoiceDashboardSummary {
  total_invoiced: number;
  total_outstanding: number;
  total_overdue: number;
  total_recovered: number;
  counts: {
    total: number;
    paid: number;
    open: number;
    overdue: number;
    partially_paid: number;
    written_off: number;
    cancelled: number;
    draft: number;
  };
  aging_buckets: {
    current: { count: number; amount: number };
    '1-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '61-90': { count: number; amount: number };
    '90+': { count: number; amount: number };
  };
  top_overdue_clients: Array<{
    client_id: number;
    client_name: string;
    company_name: string | null;
    overdue_count: number;
    overdue_amount: number;
    max_days_overdue: number;
  }>;
  ai_briefing?: DueWiseAiBriefingData | null;
}

export interface DueWiseAiBriefingResponse {
  data: DueWiseAiBriefingData;
}

export interface DueWiseAiBriefingData {
  generated_at: string;
  cached: boolean;
  cooldown_active: boolean;
  portfolio_health: DueWisePortfolioHealth;
  briefing: DueWiseBriefingContent;
  metrics: DueWiseBriefingMetrics;
  insights: DueWiseAiInsight[];
  recommended_actions: DueWiseBriefingAction[];
}

export interface DueWisePortfolioHealth {
  score: number;
  tier: 'optimal' | 'stable' | 'attention_required' | 'critical';
  label: string;
  status_color: string;
  summary_metric: string;
}

export interface DueWiseBriefingContent {
  headline: string;
  executive_summary: string;
  tone: 'urgent' | 'caution' | 'positive' | 'neutral';
  engine: 'gemini-ai' | 'deterministic-fallback';
}

export interface DueWiseBriefingMetrics {
  currency: string;
  total_outstanding: number;
  total_overdue: number;
  overdue_count: number;
  high_risk_clients_count: number;
  projected_7d_recovery: number;
  projected_30d_recovery: number;
  pending_approvals_count: number;
  duewise_mode: 'approval' | 'autopilot';
  is_autopilot: boolean;
}

export interface DueWiseAiInsight {
  id: string;
  category: 'risk_alert' | 'cash_flow' | 'channel_optimization' | 'system';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low' | 'info';
  metric_label: string;
  metric_value: string;
  client_id?: number;
  client_name?: string;
  invoice_id?: number;
  invoice_number?: string;
}

export interface DueWiseBriefingAction {
  id: string;
  type: 'quick_remind' | 'review_approvals' | 'configure_mode';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  badge: string;
  button_text: string;
  api_endpoint: string;
  method: 'POST';
  payload: Record<string, unknown> | Array<unknown>;
  invoice_id?: number;
  invoice_number?: string;
  client_name?: string;
  amount?: number;
  currency?: string;
  target_url?: string;
}

export interface CashFlowForecast {
  forecast_period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    total_expected: number;
    total_optimistic: number;
    total_conservative: number;
    total_at_risk: number;
  };
  weekly_buckets: Record<string, {
    period: string;
    expected_amount: number;
    invoice_count: number;
  }>;
  daily_projections: Array<{
    date: string;
    expected_amount: number;
    invoice_count: number;
  }>;
  upcoming_payments: Array<{
    invoice_id: number;
    invoice_number: string;
    client_name: string;
    amount_due: number;
    due_date: string;
    predicted_date: string;
    expected_amount: number;
    late_probability: number;
  }>;
}

export interface PaymentPrediction {
  probability: number;
  risk_tier: 'low' | 'medium' | 'high' | 'critical';
  predicted_payment_date: string;
  estimated_delay_days: number;
  confidence_score: number;
  risk_factors: string[];
}

export interface CommunicationLog {
  id: number;
  channel: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  tracking_token: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
}

export interface QuickBooksStatus {
  is_connected: boolean;
  realm_id: string | null;
  sync_status: 'connected' | 'syncing' | 'completed' | 'failed' | 'disconnected';
  last_synced_at: string | null;
}

export interface RecoveryCycleData {
  current_plan: 'base' | 'bigbooks';
  fee_percentage: number;
  period_start: string;
  period_end: string;
  total_overdue_recovered: number;
  accrued_recovery_fee: number;
  invoices_count: number;
  qualifying_invoices: Array<{
    id: number;
    number: string;
    client_name: string;
    amount_recovered: number;
    recovered_at: string;
    due_date: string;
    paid_at: string;
  }>;
}

export interface MonthlyRecoveryBatch {
  id: number;
  batch_number: string;
  period_start: string;
  period_end: string;
  total_recovered_amount: number;
  fee_percentage: number;
  fee_amount: number;
  invoices_count: number;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  billed_at: string;
}

export interface SubscriptionStatus {
  product: string | null;
  subscribed: boolean;
  on_trial: boolean;
  subscription: {
    id: number;
    stripe_id: string;
    stripe_status: string;
    stripe_price: string;
    type: string;
    ends_at: string | null;
  } | null;
}

export interface ProductPlan {
  id: number;
  plan_key: string;
  name: string;
  description: string | null;
  flat_amount: number | null;
  currency: string;
  billing_interval: string;
  trial_days: number;
  performance_fee_percent: number | null;
  features: string[];
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
}

export interface CurrentSubscriptionDetails {
  stripe_id: string;
  stripe_status: string;
  stripe_price: string;
  plan_key: string | null;
  on_trial: boolean;
  trial_ends_at: string | null;
  ends_at: string | null;
  cancel_at_period_end: boolean;
}

export interface ProductBillingOverview {
  product: string;
  product_name: string;
  trial_enabled: boolean;
  trial_days: number;
  is_subscribed: boolean;
  on_trial: boolean;
  trial_ends_at: string | null;
  current_plan: string | null;
  current_subscription: CurrentSubscriptionDetails | null;
  plans: ProductPlan[];
}

export interface BillingTransaction {
  id: number;
  tenant_id: string;
  product: string;
  type: 'trial_start' | 'subscription' | 'performance_fee' | 'usage' | 'refund';
  description: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  paid_at: string | null;
  receipt_url: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export type PaginatedTransactions = PaginatedResponse<BillingTransaction>;

export interface SavedPaymentMethod {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  funding: string | null;
  is_default: boolean;
}

export interface StorePaymentMethodRequest {
  payment_method: string;
  set_as_default?: boolean;
  billing_email?: string;
}

export interface SetupIntentResponse {
  client_secret: string;
}

export interface QuickBooksStatusData {
  is_connected: boolean;
  realm_id: string | null;
  sync_status: 'connected' | 'synced' | 'syncing' | 'error' | 'not_connected' | string;
  last_synced_at: string | null;
}

export interface StripeConnectStatusData {
  connected: boolean;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_id: string | null;
  bank_name: string | null;
  bank_last4: string | null;
}

export interface AccountStatusSummary {
  quickbooks_connected: boolean;
  stripe_connected: boolean;
  payouts_enabled: boolean;
  payouts_ready: boolean;
  all_connected: boolean;
}

export interface UnifiedAccountStatusResponse {
  data: {
    quickbooks: QuickBooksStatusData;
    stripe: StripeConnectStatusData;
    summary: AccountStatusSummary;
  };
}

export interface StripeConnectOnboardRequest {
  return_url?: string;
  refresh_url?: string;
}

export interface StripeConnectOnboardResponse {
  url: string;
  account_id: string;
  message: string;
}

export interface StripeConnectLoginLinkResponse {
  url: string;
}

export interface DuewiseUpgradePrompt {
  required: boolean;
  target_plan: 'base' | 'big_books' | null;
  message: string | null;
}

export interface DuewisePlanLimits {
  plan: 'trial' | 'base' | 'big_books' | 'none' | string;
  plan_name: string;
  is_trial: boolean;
  can_create_invoice: boolean;
  invoice_count: number;
  invoice_limit: number | null;
  invoices_remaining: number | null;
  can_use_email: boolean;
  can_use_sms: boolean;
  can_use_whatsapp: boolean;
  can_use_smart_channel: boolean;
  allowed_channels: string[];
  cycle_start: string;
  cycle_end: string;
  upgrade_prompt: DuewiseUpgradePrompt;
}

export interface QualifyingInvoiceItem {
  id: number;
  number: string;
  client_name: string;
  currency: string;
  amount_recovered: number;
  amount_recovered_usd: number;
  recovered_at: string | null;
  due_date: string | null;
  paid_at: string | null;
}

export interface CurrentCycleSummaryData {
  current_plan: 'base' | 'big_books' | string;
  fee_percentage: number;
  period_start: string;
  period_end: string;
  total_overdue_recovered: number;
  accrued_recovery_fee: number;
  currency: string;
  invoices_count: number;
  qualifying_invoices: QualifyingInvoiceItem[];
}

export interface CurrentCycleSummaryResponse {
  data: CurrentCycleSummaryData;
}

export interface MonthlyRecoveryBatchBreakdownItem {
  id: number;
  number: string;
  currency: string;
  amount_recovered: number;
  amount_recovered_usd: number;
}

export interface MonthlyRecoveryBatchMetadata {
  invoice_count: number;
  invoice_ids: number[];
  invoices_breakdown?: MonthlyRecoveryBatchBreakdownItem[];
  currency_conversion?: {
    target_currency: string;
    rates: Record<string, number>;
  };
  retried_at?: string;
  retried_successfully?: boolean;
  last_retry_error?: string;
  last_retried_at?: string;
}

export interface MonthlyRecoveryBatch {
  id: number;
  tenant_id: string;
  period_start: string;
  period_end: string;
  plan_key: string;
  total_recovered_amount: string | number;
  fee_percentage: string | number;
  fee_amount: string | number;
  currency: string;
  performance_fee_id: number | null;
  status: 'charged' | 'failed';
  charged_at: string | null;
  can_retry: boolean;
  metadata: MonthlyRecoveryBatchMetadata | null;
  created_at: string;
  updated_at: string;
}

export type PaginatedRecoveryBatches = PaginatedResponse<MonthlyRecoveryBatch>;

export interface RetryRecoveryBatchResponse {
  message: string;
  data: MonthlyRecoveryBatch;
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  retry_after_seconds?: number;
  current_count?: number;
  limit?: number;
  plan?: string;
  upgrade_url?: string;
  requested_channel?: string;
  allowed_channels?: string[];
}
```

---

## 10. Ready-to-Use Axios API Client Snippet

Copy and paste this into `src/lib/api.ts` for quick Cursor integration:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Attach current active token (handles temporary token during onboarding and permanent token after)
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem('age_token') || sessionStorage.getItem('age_temp_token'))
    : null;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle global responses and redirects
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error;

    if (typeof window !== 'undefined') {
      // 401 Unauthorized: Redirect to login
      if (status === 401) {
        localStorage.removeItem('age_token');
        sessionStorage.removeItem('age_temp_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      // 403 Forbidden: Temporary token attempting protected routes
      if (status === 403 && errorCode === 'InvalidTokenException') {
        window.location.href = '/verify-otp';
      }

      // 402 Payment Required: 7-day trial ended
      if (status === 402) {
        window.location.href = '/billing/subscribe';
      }
    }

    return Promise.reject(error);
  }
);
```
