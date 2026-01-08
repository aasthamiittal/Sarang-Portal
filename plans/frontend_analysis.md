# Frontend Structure Analysis

## Overview
The frontend is a production-ready React SPA built with Vite, React Router, Material-UI, and Tailwind CSS. It provides a comprehensive shipping management interface with real-time data, role-based access, and full integration with backend APIs for carrier management, document generation, and automated workflows.

## Routing Structure
- **Root Route (/)**: Redirects to Login if not authenticated, otherwise to Dashboard.
- **Authenticated Routes (/*)**: Wrapped in Layout component with sidebar navigation.
- **Key Routes**:
  - `/dashboard`: Actionable dashboard with health cards, clickable widgets, system metrics.
  - `/shipments`: Full shipment lifecycle management with PDF generation.
  - `/multi-box`: Multi-box shipment handling.
  - `/manifests`: Manifest creation with PDF export.
  - `/pickup`: Pickup scheduling.
  - `/rate-comparison`: Rate calculator.
  - `/bulk-report`: Bulk reporting with real PDF exports.
  - `/billing`: Wallet and billing management with payment integration.
  - `/documents`: Document uploads and management.
  - `/integrations`: Third-party integrations.
  - `/request-quote`: Quote requests.
  - `/profile`: User profile, settings, KYC verification.
  - `/admin`: Administrative functions including KYC review.
  - `/finance`: Financial dashboard with GST-compliant reports.
  - `/notifications`: Complete notification management with real-time updates.
  - `/ndr`: NDR cases with automated workflows.
  - Additional admin routes: `/audit-log`, `/kyc`.

## Authentication Flow
- **Context**: AuthContext manages authentication state, token storage, and API interceptors.
- **Login Process**:
  1. User enters email/password on Login view.
  2. Form submits to AuthContext.login(), which calls POST /api/auth/.
  3. On success, JWT token stored in localStorage, axios headers set, user profile fetched.
  4. Redirect to /dashboard.
- **Token Management**:
  - JWT decoded on load, profile fetched from /api/auth/profile.
  - Axios interceptor handles 401 errors by logging out and redirecting to /.
  - Logout clears token and redirects to /.
- **Profile Updates**: PUT /api/auth/profile and /api/auth/settings for user data updates.

## Key Views
- **Login**: Form with email, password, terms checkbox; uses Material-UI components.
- **Dashboard**: Actionable overview with order summaries, health cards (carrier sync, wallet alerts, stuck shipments), clickable widgets for NDR/exceptions.
- **Shipments**: List and manage shipments; includes ShipmentForm dialog for create/edit; PDF generation for labels/invoices.
- **ShipmentForm**: Modal dialog with nested fields for origin, destination, customer info, product details; KYC validation.
- **Billing**: Wallet management, balance display, activity log; payment gateway integration.
- **Profile**: User settings, complete KYC verification workflow with document upload/resubmission.
- **Admin**: Administrative controls, audit logs, KYC document review interface.
- **FinanceDashboard**: Financial metrics and GST-compliant reports.
- **Notifications**: Notification preferences, real-time updates, delivery status logging.
- **Integrations**: Manage API integrations with real carrier connections.
- **Documents**: Upload and view documents with PDF generation.
- **Manifests**: Create and track manifests with PDF export.
- **Pickup**: Schedule pickups.
- **RateComparison**: Compare carrier rates with real API data.
- **RequestQuote**: Submit quote requests.
- **BulkReport**: Generate bulk reports with real PDF exports.
- **MultiBox**: Handle multi-box shipments.
- **NdrList**: Manage NDR cases with automated escalation/RTO.

## Components
- **Layout**: Main layout with sidebar and content area; handles responsive design.
- **Sidebar**: Navigation menu with role-based items; collapsible on mobile.
- **ErrorBoundary**: Catches and displays errors in child components.
- **ExceptionWidgets**: Displays NDR and exception case counts with navigation links to filtered views.
- **NdrList**: List of NDR cases with action buttons for reattempt/RTO/hold.
- **NotificationPreferences**: Manage notification settings including SMS/webhook preferences.
- **Timeline**: Displays shipment tracking timeline with real carrier data.

## Navigation
- **Sidebar**: Fixed left sidebar with menu items filtered by user role (admin, manager, staff, user).
- **Menu Items**: Dashboard, Orders, Multi Box, Manifests, Pickup, Rate Calculator, Bulk Report, Wallet, Documents, Integrations, Request Quote, Settings; admin adds Finance, Admin, Audit Log, KYC Review.
- **Mobile**: Hamburger menu toggles sidebar overlay.
- **Active State**: Highlights current route.
- **Logout**: Button at bottom of sidebar.

## Buttons and UI Elements
- **Primary Buttons**: Blue background (bg-blue-600), hover effects; used for submits, creates, updates.
- **Secondary Buttons**: White with border, hover gray; used for cancels, filters.
- **Action Buttons**: Icons with text, hover backgrounds; in cards and lists.
- **Form Elements**: Material-UI TextField, Checkbox, Select; Tailwind classes for consistency.
- **Cards**: White backgrounds with shadows, clickable for navigation to detailed views.
- **Icons**: Lucide React icons (ShoppingCart, Edit, etc.), Material-UI icons (Visibility, etc.).
- **Responsive Grid**: Tailwind grid classes for different screen sizes.

## API Calls
- **Base URL**: http://localhost:5000/api (from constants.js).
- **Authentication**: Bearer token in headers for all requests.
- **Key Endpoints**:
  - Auth: /auth/ (login, profile, settings, logout).
  - Shipments: /shipments (CRUD), /bulk, /export, /dashboard-summary, /ops-metrics, /:id/label, /:id/customs-invoice, /:id/billing-invoice, /:id/events.
  - Billing: /billing (CRUD), /balance, /activity, /recharge.
  - KYC: /kyc/upload, /documents, /status, /resubmit/:id.
  - Admin: /admin/users, /kyc/pending, /kyc/:id/review.
  - Wallet: /wallet/balance, /wallet/activity.
  - Notifications: /notifications/unread-count, /preferences/me.
  - Tracking: /tracking/health.
  - Carriers, rates, manifests, pickups, documents, integrations, quotes, awb, customs, ledger, automation, webhooks, ndr, finance, reports.
- **Data Fetching**: Axios with Promise.allSettled for parallel requests; error handling with fallbacks.
- **Interceptors**: Automatic logout on 401.

## UI Flows
1. **User Login**: Login form -> Authenticate -> Redirect to Dashboard.
2. **KYC Verification**: Upload documents -> Check status -> Resubmit if rejected -> Unblock shipments.
3. **Dashboard Overview**: Load summaries, health metrics -> Click widgets to navigate to filtered views.
4. **Create Shipment**: Check KYC -> Navigate to Shipments -> Open ShipmentForm -> Fill form -> Submit -> Generate PDFs.
5. **Manage Billing**: View balance and activity -> Recharge via payment gateway -> View transactions.
6. **Admin Functions**: Access restricted views -> Review KYC documents -> Perform admin tasks.
7. **Notifications**: Bell icon shows unread count -> Click to view notifications -> Manage preferences.
8. **Responsive Navigation**: Desktop sidebar -> Mobile hamburger menu.

## Mermaid Diagram
```mermaid
graph TD
    A[User Visits App] --> B{Authenticated?}
    B -->|No| C[Login View]
    C --> D[Enter Credentials]
    D --> E[AuthContext.login()]
    E --> F{JWT Valid?}
    F -->|Yes| G[Store Token, Fetch Profile]
    G --> H[Redirect to Dashboard]
    F -->|No| I[Show Error]
    I --> D
    B -->|Yes| H
    H --> J[Layout with Sidebar]
    J --> K[Dashboard View]
    K --> L[Fetch Data from APIs]
    L --> M[Display Summaries, Cards, Widgets]
    M --> N[User Interactions]
    N --> O[Navigate to Views]
    O --> P[Shipments, Billing, etc.]
    P --> Q[Perform Actions]
    Q --> R[API Calls]
    R --> S[Update UI]
    S --> N