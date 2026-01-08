# Frontend Structure Analysis

## Overview
The frontend is a React-based single-page application (SPA) built with Vite, using React Router for navigation, Material-UI and Tailwind CSS for styling, and Axios for API communication. It provides a comprehensive dashboard for managing shipments, billing, integrations, and administrative functions in a logistics/shipping management system. The app features role-based access control, real-time data fetching, and responsive design.

## Routing Structure
- **Root Route (/)**: Redirects to Login if not authenticated, otherwise to Dashboard.
- **Authenticated Routes (/*)**: Wrapped in Layout component with sidebar navigation.
- **Key Routes**:
  - `/dashboard`: Main dashboard with summaries and metrics.
  - `/shipments`: Shipment management (CRUD operations).
  - `/multi-box`: Multi-box shipment handling.
  - `/manifests`: Manifest creation and management.
  - `/pickup`: Pickup scheduling.
  - `/rate-comparison`: Rate calculator.
  - `/bulk-report`: Bulk reporting.
  - `/billing`: Wallet and billing management.
  - `/documents`: Document uploads and management.
  - `/integrations`: Third-party integrations.
  - `/request-quote`: Quote requests.
  - `/profile`: User profile and settings.
  - `/admin`: Administrative functions.
  - `/finance`: Financial dashboard.
  - `/notifications`: Notification management.
  - `/ndr`: NDR (Non-Delivery Report) cases.
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
- **Dashboard**: Comprehensive overview with order summaries, actions, wallet balance, recent shipments; fetches from multiple endpoints.
- **Shipments**: List and manage shipments; includes ShipmentForm dialog for create/edit.
- **ShipmentForm**: Modal dialog with nested fields for origin, destination, customer info, product details.
- **Billing**: Wallet management, balance display, activity log.
- **Profile**: User settings, KYC verification for users.
- **Admin**: Administrative controls, audit logs.
- **FinanceDashboard**: Financial metrics and reports.
- **Notifications**: Notification preferences and history.
- **Integrations**: Manage API integrations.
- **Documents**: Upload and view documents.
- **Manifests**: Create and track manifests.
- **Pickup**: Schedule pickups.
- **RateComparison**: Compare carrier rates.
- **RequestQuote**: Submit quote requests.
- **BulkReport**: Generate bulk reports.
- **MultiBox**: Handle multi-box shipments.
- **NdrList**: Manage NDR cases.

## Components
- **Layout**: Main layout with sidebar and content area; handles responsive design.
- **Sidebar**: Navigation menu with role-based items; collapsible on mobile.
- **ErrorBoundary**: Catches and displays errors in child components.
- **ExceptionWidgets**: Displays NDR and exception case counts with navigation links.
- **NdrList**: List of NDR cases.
- **NotificationPreferences**: Manage notification settings.
- **Timeline**: Likely displays shipment tracking timeline.

## Navigation
- **Sidebar**: Fixed left sidebar with menu items filtered by user role (admin, manager, staff, user).
- **Menu Items**: Dashboard, Orders, Multi Box, Manifests, Pickup, Rate Calculator, Bulk Report, Wallet, Documents, Integrations, Request Quote, Settings; admin adds Finance, Admin, Audit Log.
- **Mobile**: Hamburger menu toggles sidebar overlay.
- **Active State**: Highlights current route.
- **Logout**: Button at bottom of sidebar.

## Buttons and UI Elements
- **Primary Buttons**: Blue background (bg-blue-600), hover effects; used for submits, creates, updates.
- **Secondary Buttons**: White with border, hover gray; used for cancels, filters.
- **Action Buttons**: Icons with text, hover backgrounds; in cards and lists.
- **Form Elements**: Material-UI TextField, Checkbox, Select; Tailwind classes for consistency.
- **Cards**: White backgrounds with shadows, clickable for navigation.
- **Icons**: Lucide React icons (ShoppingCart, Edit, etc.), Material-UI icons (Visibility, etc.).
- **Responsive Grid**: Tailwind grid classes for different screen sizes.

## API Calls
- **Base URL**: http://localhost:5000/api (from constants.js).
- **Authentication**: Bearer token in headers for all requests.
- **Key Endpoints**:
  - Auth: /auth/ (login, profile, settings, logout).
  - Shipments: /shipments (CRUD, dashboard-summary, ops-metrics, actions-summary, bulk, export).
  - Billing: /billing (CRUD, balance, activity, recharge).
  - Wallet: /wallet/balance, /wallet/activity.
  - Notifications: /notifications/unread-count.
  - Tracking: /tracking/health.
  - Carriers, rates, manifests, pickups, documents, integrations, quotes, awb, customs, ledger, automation, webhooks, ndr, finance, reports.
- **Data Fetching**: Axios with Promise.allSettled for parallel requests; error handling with fallbacks.
- **Interceptors**: Automatic logout on 401.

## UI Flows
1. **User Login**: Login form -> Authenticate -> Redirect to Dashboard.
2. **Dashboard Overview**: Load summaries, metrics, activities -> Display cards and widgets -> Navigate to details on click.
3. **Create Shipment**: Navigate to Shipments -> Open ShipmentForm dialog -> Fill form -> Submit -> Refresh list.
4. **Manage Billing**: View balance and activity -> Recharge or view transactions.
5. **Admin Functions**: Access restricted views based on role -> Perform admin tasks.
6. **Notifications**: Bell icon shows unread count -> Click to view notifications.
7. **Responsive Navigation**: Desktop sidebar -> Mobile hamburger menu.

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