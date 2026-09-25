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
6. [Endpoint Reference: Duewise (Invoice Management, AI & Collections)](#6-endpoint-reference-duewise-invoice-management-ai--collections)
   - **6.1 Dashboard & Cash Flow Forecast**
     - [`GET /api/duewise/dashboard`](#get-apiduewisedashboard)
     - [`GET /api/duewise/forecast`](#get-apiduewiseforecast)
   - **6.2 Invoices CRUD & Operations**
     - [`GET /api/duewise/invoices`](#get-apiduewiseinvoices)
     - [`POST /api/duewise/invoices`](#post-apiduewiseinvoices)
     - [`GET /api/duewise/invoices/{id}`](#get-apiduewiseinvoicesid)
     - [`PUT /api/duewise/invoices/{id}`](#put-apiduewiseinvoicesid)
     - [`DELETE /api/duewise/invoices/{id}`](#delete-apiduewiseinvoicesid)
     - [`POST /api/duewise/invoices/{id}/mark-as-paid`](#post-apiduewiseinvoicesidmark-as-paid)
     - [`GET /api/duewise/invoices/{id}/prediction`](#get-apiduewiseinvoicesidprediction)
     - [`POST /api/duewise/invoices/{id}/predict`](#post-apiduewiseinvoicesidpredict)
     - [`POST /api/duewise/invoices/{id}/remind`](#post-apiduewiseinvoicesidremind)

     - [`GET /api/duewise/invoices/{id}/activity`](#get-apiduewiseinvoicesidactivity)
  
   - **6.3 QuickBooks Online 2-Way Integration**
     - [`GET /api/duewise/quickbooks/connect`](#get-apiduewisequickbooksconnect)
     - [`GET|POST /api/duewise/quickbooks/callback`](#getpost-apiduewisequickbookscallback)
     - [`GET /api/duewise/quickbooks/status`](#get-apiduewisequickbooksstatus)
     - [`POST /api/duewise/quickbooks/sync`](#post-apiduewisequickbookssync)
     - [`POST /api/duewise/quickbooks/disconnect`](#post-apiduewisequickbooksdisconnect)
   - **6.4 Monthly Recovery Fee Engine (Base 15% vs Big Books 10%)**
     - [`GET /api/duewise/recovery-fee/current-cycle`](#get-apiduewiserecovery-feecurrent-cycle)
     - [`GET /api/duewise/recovery-fee/batches`](#get-apiduewiserecovery-feebatches)
   - **6.5 Public Communication Tracking (No Auth)**
     - [`GET /api/duewise/track/open/{token}`](#get-apiduewisetrackopentoken)
     - [`GET /api/duewise/track/click/{token}`](#get-apiduewisetrackclicktoken)
7. [Endpoint Reference: Billing & Subscriptions](#7-endpoint-reference-billing--subscriptions)
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
  "business_tone": "polite",
  "business_phone": "+15559876543",
  "country": "US",
  "currency": "usd",
  "timezone": "America/New_York",
  "website": "https://acmelegal.com",
  "tax_id": "EIN-12-3456789"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | User full name (Max: 255). |
| `business_name` | `string` | **Yes** | Registered company name (Max: 255). |
| `business_type` | `string` | **Yes** | e.g., `'llc'`, `'corporation'`, `'sole_proprietorship'`, `'partnership'`. |
| `business_category` | `string` | **Yes** | e.g., `'legal_services'`, `'consulting'`, `'medical'`, `'accounting'`. |
| `business_tone` | `string` | Optional | Tone for customer outreach: `'polite'`, `'professional'`, `'firm'` (default: `'polite'`). |
| `phone` | `string` | Optional | User direct phone (Max: 50). |
| `business_phone` | `string` | Optional | Company official phone (Max: 50). |
| `country` | `string` | Optional | Country code or name (e.g. `'US'`, default `'US'`). |
| `currency` | `string` | Optional | 3-letter currency code (e.g. `'usd'`). |
| `timezone` | `string` | Optional | e.g. `'America/New_York'`. |
| `website` | `string` | Optional | Valid URL (e.g. `'https://acmelegal.com'`). |
| `tax_id` | `string` | Optional | EIN / VAT / Tax ID number. |

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
List all clients under the current tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Query Parameters**:
  - `risk_tier` (Optional): Filter by risk level (`'low'`, `'medium'`, `'high'`).
  - `search` (Optional): Text search by client name, company name, or email.

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
  ]
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
| `risk_tier` | `string` | Optional | `'low'`, `'medium'`, `'high'`. |
| `quickbooks_id` | `string` | Optional | QuickBooks customer ID. |
| `metadata` | `object` | Optional | Key-value JSON object. |

#### Response: `201 Created`
Returns the created `Client` object in `{ "data": { ... } }`.

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
    ]
  }
}
```

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
| `metadata` | `object` | Optional | Arbitrary JSON key-value pairs. |

- **Response: `201 Created`**: Returns the complete created `InvoiceResource`.

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
    "predicted_payment_date": "2026-09-28",
    "estimated_delay_days": 14,
    "confidence_score": 86.3,
    "risk_factors": [
      "Client historically paid late on 45% of previous invoices.",
      "Client broke 1 previously committed payment promise(s)."
    ]
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
Dispatches a collection reminder to the client. Can let AI select the channel (`auto`) based on past client responsiveness, or specify an explicit channel (`email`, `sms`, `whatsapp`).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Request Body**:
```json
{
  "channel": "auto",
  "custom_message": "Hi Apex Logistics, this is a friendly reminder that invoice #INV-2026-002 is due on Sep 24."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `channel` | `string` | Optional | `'auto'` (Smart Channel AI), `'email'`, `'sms'`, or `'whatsapp'`. Default: `'auto'`. |
| `custom_message` | `string` | Optional | Custom message override. If omitted, default template is dispatched. |

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

---

#### `GET /api/duewise/invoices/{id}/activity`
Returns the chronological audit trail and communication log for this invoice (sent reminders, delivery events, email opens, payment link clicks, and client replies).

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
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
  ]
}
```

---

### 6.3 QuickBooks Online 2-Way Integration

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

### 6.4 Monthly Recovery Fee Engine (Base 15% vs Big Books 10%)

Platform charges a success fee only on **overdue amounts successfully recovered** each month. The fee is charged as a single monthly batch (never per invoice).

- **Duewise Base Plan**: **15%** recovery fee.
- **Duewise Big Books Plan**: **10%** recovery fee.

#### `GET /api/duewise/recovery-fee/current-cycle`
Inspects live unbilled overdue recoveries in the current calendar month.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": {
    "current_plan": "base",
    "fee_percentage": 15.0,
    "period_start": "2026-09-01",
    "period_end": "2026-09-30",
    "total_overdue_recovered": 10000.0,
    "accrued_recovery_fee": 1500.0,
    "invoices_count": 2,
    "qualifying_invoices": [
      {
        "id": 101,
        "number": "INV-2026-001",
        "client_name": "Apex Global Logistics",
        "amount_recovered": 6000.0,
        "recovered_at": "2026-09-05T14:30:00.000000Z",
        "due_date": "2026-08-15",
        "paid_at": "2026-09-05T14:30:00.000000Z"
      },
      {
        "id": 104,
        "number": "INV-2026-004",
        "client_name": "Metro Transit Partners",
        "amount_recovered": 4000.0,
        "recovered_at": "2026-09-08T09:12:00.000000Z",
        "due_date": "2026-08-20",
        "paid_at": "2026-09-08T09:12:00.000000Z"
      }
    ]
  }
}
```

---

#### `GET /api/duewise/recovery-fee/batches`
Returns historical recovery billing batches charged to the tenant's default card via Stripe.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Product Access Required**: `duewise`
- **Response: `200 OK`**:
```json
{
  "data": [
    {
      "id": 1,
      "batch_number": "RF-2026-08-tenant-abc12345",
      "period_start": "2026-08-01",
      "period_end": "2026-08-31",
      "total_recovered_amount": 12000.0,
      "fee_percentage": 15.0,
      "fee_amount": 1800.0,
      "invoices_count": 3,
      "stripe_payment_intent_id": "pi_123456789",
      "status": "succeeded",
      "billed_at": "2026-09-01T00:05:00.000000Z"
    }
  ]
}
```

---

### 6.5 Public Communication Tracking (No Auth)

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
  quickbooks_id: string | null;
  ai_predicted_late_probability: number | null;
  ai_predicted_payment_date: string | null;
  client?: Client;
  line_items?: InvoiceLineItem[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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

export interface ApiErrorResponse {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  retry_after_seconds?: number;
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
