# Backend Structure Analysis

## Overview
The backend is built with Node.js, Express.js, and MongoDB (via Mongoose). It provides a RESTful API for a shipping/logistics management system, handling authentication, shipments, billing, carriers, and more.

## Server Setup (server.js)
- Express app with CORS, JSON parsing.
- MongoDB connection.
- Routes mounted under `/api/`.
- Services started: trackingSync, scheduledReports.

## Authentication Flow
- **Routes**: `/api/auth`
  - POST `/register`: Register user, hash password with bcrypt, create User.
  - POST `/`: Login, verify password, issue JWT.
  - GET/PUT `/profile`: Manage profile.
  - PUT `/settings`: Update settings.
  - PUT `/password`: Change password.
  - POST `/logout`: Log logout.
- **Middleware**: `auth.js` - JWT verification, role-based access (admin, manager, staff).
- **Model**: User - email, password, role, settings, billingType (prepaid/postpaid), KYC fields.

## Shipment Flow
- **Routes**: `/api/shipments`
  - CRUD operations.
  - Bulk upload via CSV.
  - Export to CSV.
  - Dashboard summaries (actions, ops metrics).
  - Label generation (requires AWB).
  - Tracking events.
- **Model**: Shipment - orderId, trackingNumber, awbNumber, origin/destination, carrier, weight, cost, statusHistory, immutability rules after label/manifest.
- **Statuses**: DRAFT -> BOOKED -> LABEL_GENERATED -> PACKED -> MANIFESTED -> DISPATCHED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED/NDR/RTO/LOST/DAMAGED.
- **Interactions**: Creates Billing, TrackingEvent, applies automation rules (carrier selection, auto manifest), sends notifications.

## Billing Flow
- **Routes**: `/api/billing`
  - CRUD for billing records.
  - GET `/balance`: Calculate wallet balance.
  - GET `/activity`: Wallet activity from AccountLedger.
  - POST `/recharge`: Add credit to wallet.
- **Models**: Billing (per shipment), AccountLedger (debits/credits).
- **Service**: billingService - Processes billing on shipment events (fees for label, manifest, delivery; refunds for lost/damaged). Supports prepaid (wallet) and postpaid (outstanding).

## Key Services
- **trackingSync**: Polls carriers every 5 min for tracking updates, maps statuses, creates TrackingEvents.
- **automationEngine**: Evaluates rules for triggers (CARRIER_SELECTION, AUTO_MANIFEST, NDR_ACTION, WALLET_ALERT).
- **notificationService**: Sends emails/SMS/webhooks based on templates and user preferences.
- **carriers**: FedEx service (mocked) for AWB generation, label fetch, tracking.

## Database Interactions
- MongoDB with Mongoose.
- Models: User, Shipment, Billing, AccountLedger, Carrier, TrackingEvent, etc.
- Queries: Filters, pagination, aggregations for dashboards (status counts, aging, etc.).

## External Integrations
- **Carriers**: FedEx API (generate AWB, fetch label/tracking).
- **Notifications**: SMTP for emails, SMS (mocked), webhooks via axios.
- **Others**: CSV parsing, encryption for API keys.

## API Endpoints Summary
- Auth: /api/auth/register, /login, /profile, /settings, /password, /logout
- Shipments: /api/shipments (CRUD), /bulk, /export, /dashboard-summary, /ops-metrics, /:id/label, /:id/events
- Billing: /api/billing (CRUD), /balance, /activity, /recharge
- Others: Carriers, rates, manifests, pickups, documents, integrations, quotes, wallet, awb, customs, ledger, automation, webhooks, ndr, finance, notifications, tracking

## Key Flows
1. **User Registration/Login**: Register -> Hash password -> JWT token.
2. **Create Shipment**: POST shipment -> Auto carrier if not set -> Create billing/tracking event -> Automation rules.
3. **Status Update**: PUT shipment -> Validate transition -> Assign AWB if LABEL_GENERATED -> Process billing -> Send notifications -> Automation (e.g., auto manifest on PACKED).
4. **Tracking Sync**: Service polls carriers -> Map statuses -> Create events -> Update shipment if new status.
5. **Billing**: On events -> Debit/credit ledger -> Check balance -> Notify if low.
6. **Notifications**: On events -> Check preferences -> Send via email/SMS/webhook.

## Mermaid Diagram
```mermaid
graph TD
    A[User Login] --> B[JWT Auth]
    B --> C[Create Shipment]
    C --> D[Auto Carrier Selection]
    C --> E[Create Billing]
    C --> F[Initial Tracking Event]
    F --> G[Status Update]
    G --> H[Validate Transition]
    H --> I[Assign AWB if LABEL_GENERATED]
    H --> J[Process Billing]
    J --> K[Send Notification]
    H --> L[Automation Rules]
    L --> M[Auto Manifest on PACKED]
    L --> N[NDR Action]
    O[Tracking Sync Service] --> P[Poll Carriers]
    P --> Q[Map Status]
    Q --> R[Create Tracking Event]
    R --> S[Update Shipment Status]