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
6. [Endpoint Reference: Invoices (Duewise)](#6-endpoint-reference-invoices-duewise)
   - [`GET /api/invoices`](#get-apiinvoices)
7. [Endpoint Reference: Billing & Subscriptions](#7-endpoint-reference-billing--subscriptions)
   - [`GET /api/billing/plans`](#get-apibillingplans)
   - [`GET /api/billing/transactions`](#get-apibillingtransactions)
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
- **Access Requirement**: Requires active 7-day trial or active subscription to `duewise` (`subscribed:duewise` middleware). If the trial has expired without an active subscription, endpoints return `402 Payment Required` (`TrialExpiredException`).

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

## 6. Endpoint Reference: Invoices (Duewise)

### `GET /api/duewise/invoices`
Fetches all invoices belonging to the tenant.

- **Auth Required**: Yes (`Bearer <permanent_token>`)
- **Subscription Required**: Active or trialing subscription to `duewise` (`product.subscribed:duewise` middleware).
- **No Subscription Error: `403 Forbidden`**:
```json
{
  "message": "This feature requires an active Duewise subscription."
}
```

#### Response: `200 OK`
```json
{
  "data": [
    {
      "id": 101,
      "tenant_id": "tenant-b7e19f2a",
      "client_id": 1,
      "invoice_number": "INV-2026-001",
      "amount": 2500.0,
      "amount_paid": 500.0,
      "amount_due": 2000.0,
      "currency": "USD",
      "status": "overdue",
      "issue_date": "2026-08-01",
      "due_date": "2026-08-15",
      "days_overdue": 24,
      "aging_bucket": "1-30",
      "created_at": "2026-08-01T00:00:00.000000Z",
      "updated_at": "2026-08-16T00:00:00.000000Z"
    }
  ]
}
```

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
| `payment_method` | `string` | **Yes** | Stripe Payment Method ID (`pm_...`) obtained from Stripe Elements frontend. |
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

export interface Invoice {
  id: number;
  tenant_id: string;
  client_id: number;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'uncollectible';
  issue_date: string;
  due_date: string;
  days_overdue: number;
  aging_bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  created_at: string;
  updated_at: string;
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
