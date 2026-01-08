# Backend Structure Analysis

## Overview
The backend is a production-ready Node.js/Express.js API with MongoDB, providing comprehensive shipping/logistics management with real carrier integrations, automated workflows, and enterprise-grade features.

## Server Setup (server.js)
- Express app with CORS, JSON parsing, security middleware.
- MongoDB connection with connection pooling.
- Routes mounted under `/api/`.
- Services started: trackingSync, scheduledReports, automationEngine.

## Authentication Flow
- **Routes**: `/api/auth`
  - POST `/register`: Register user, hash password with bcrypt, create User.
  - POST `/`: Login, verify password, issue JWT.
  - GET/PUT `/profile`: Manage profile.
  - PUT `/settings`: Update settings.
  - PUT `/password`: Change password.
  - POST `/logout`: Log logout.
- **Middleware**: `auth.js` - JWT verification, role-based access (admin, manager, staff).
- **Model**: User - email, password, role, settings, billingType (prepaid/postpaid), KYC fields (gstNumber, panNumber, iecNumber, kycStatus), webhookSecret.

## Shipment Flow
- **Routes**: `/api/shipments`
  - CRUD operations with KYC verification blocking.
  - Bulk upload via CSV.
  - Export to CSV.
  - Dashboard summaries (actions, ops metrics, health cards).
  - PDF label/customs invoice/billing invoice generation.
  - Tracking events with real carrier data.
- **Model**: Shipment - orderId, trackingNumber, awbNumber, origin/destination, carrier, weight, cost, statusHistory, exceptionFlags, immutability rules after label/manifest.
- **Statuses**: DRAFT -> BOOKED -> LABEL_GENERATED -> PACKED -> MANIFESTED -> DISPATCHED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED/NDR/RTO/LOST/DAMAGED.
- **Interactions**: Creates Billing, TrackingEvent, applies automation rules, sends notifications, generates PDFs.

## Billing Flow
- **Routes**: `/api/billing`
  - CRUD for billing records.
  - GET `/balance`: Calculate wallet balance.
  - GET `/activity`: Wallet activity from AccountLedger.
  - POST `/recharge`: Add credit to wallet.
- **Models**: Billing (per shipment), AccountLedger (debits/credits).
- **Service**: billingService - Processes billing on shipment events, supports prepaid/postpaid, GST calculations.

## KYC Workflow
- **Routes**: `/api/kyc`
  - POST `/upload`: Upload GST/PAN/IEC documents.
  - GET `/documents`: List user documents.
  - GET `/status`: KYC verification status.
  - POST `/resubmit/:documentId`: Resubmit rejected documents.
- **Admin Routes**: `/api/admin/kyc`
  - GET `/pending`: List pending documents.
  - POST `/:documentId/review`: Approve/reject documents.
- **Model**: KycDocument - documentType, status, rejectionReason, verifiedBy.
- **Integration**: Blocks shipment creation if KYC not approved.

## Document Generation
- **Service**: pdfService - Generates PDFs for shipping labels, customs invoices, manifests, billing invoices.
- **Routes**: `/api/shipments/:id/label`, `/customs-invoice`, `/billing-invoice`; `/api/manifests/:id/pdf`
- **Storage**: Documents stored in Document model with proper metadata.

## Key Services
- **trackingSync**: Polls carriers every 5 min with real APIs, maps statuses, creates TrackingEvents, exponential backoff.
- **automationEngine**: Evaluates rules for triggers (CARRIER_SELECTION, AUTO_MANIFEST, NDR_ACTION, WALLET_ALERT).
- **notificationService**: Sends emails/SMS/webhooks with HMAC signing, retry logic, success/failure logging.
- **pdfService**: Generates professional PDFs for all document types.
- **scheduledReports**: Automated NDR escalation, RTO processing, weekly/monthly reports.
- **carriers**: FedEx service with real API integration (OAuth2, Ship API, Track API).

## Database Interactions
- MongoDB with Mongoose, indexed queries.
- Models: User, Shipment, Billing, AccountLedger, Carrier, TrackingEvent, NdrCase, KycDocument, Document, etc.
- Queries: Complex filters, pagination, aggregations for dashboards, real-time metrics.

## External Integrations
- **Carriers**: FedEx real API (AWB generation, label PDF, tracking updates).
- **Notifications**: SMTP emails, Twilio SMS, HMAC-signed webhooks.
- **Payments**: Razorpay integration for prepaid/postpaid billing.
- **Documents**: PDF generation with PDFKit.
- **Others**: CSV parsing, encryption for sensitive data.

## API Endpoints Summary
- Auth: /api/auth/register, /login, /profile, /settings, /password, /logout
- Shipments: /api/shipments (CRUD), /bulk, /export, /dashboard-summary, /ops-metrics, /:id/label, /:id/customs-invoice, /:id/billing-invoice, /:id/events
- Billing: /api/billing (CRUD), /balance, /activity, /recharge
- KYC: /api/kyc/upload, /documents, /status, /resubmit/:id
- Admin: /api/admin/users, /kyc/pending, /kyc/:id/review
- Others: Carriers, rates, manifests, pickups, documents, integrations, quotes, wallet, awb, customs, ledger, automation, webhooks, ndr, finance, notifications, tracking

## Key Flows
1. **User Registration/Login**: Register -> Hash password -> JWT token.
2. **KYC Verification**: Upload documents -> Admin review -> Approve/Reject -> Block shipments if pending.
3. **Create Shipment**: Check KYC -> POST shipment -> Auto carrier -> Create billing/tracking -> Automation rules.
4. **Status Update**: PUT shipment -> Validate transition -> Generate real AWB/labels -> Process billing -> Send notifications.
5. **Tracking Sync**: Service polls real carrier APIs -> Map statuses -> Create events -> Update shipment.
6. **NDR Automation**: Scheduled escalation -> Auto-RTO -> Customer notifications.
7. **Billing**: On events -> Debit/credit ledger -> GST calculations -> Payment processing.
8. **Notifications**: On events -> Check preferences -> Send via email/SMS/webhook with retries.
9. **Document Generation**: On-demand PDF creation for labels, invoices, manifests.

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