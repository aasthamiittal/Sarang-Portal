import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from '../views/Dashboard';
import Shipments from '../views/Shipments';
import MultiBox from '../views/MultiBox';
import Manifests from '../views/Manifests';
import Pickup from '../views/Pickup';
import RateComparison from '../views/RateComparison';
import BulkReport from '../views/BulkReport';
import Billing from '../views/Billing';
import Documents from '../views/Documents';
import Integrations from '../views/Integrations';
import RequestQuote from '../views/RequestQuote';
import Profile from '../views/Profile';
import Admin from '../views/Admin';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden bg-white p-4 shadow flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 text-2xl"
          >
            ☰
          </button>
        </header>
        <main className="flex-1 p-6 lg:ml-64">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/multi-box" element={<MultiBox />} />
            <Route path="/manifests" element={<ErrorBoundary><Manifests /></ErrorBoundary>} />
            <Route path="/pickup" element={<Pickup />} />
            <Route path="/rate-comparison" element={<RateComparison />} />
            <Route path="/bulk-report" element={<BulkReport />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/request-quote" element={<RequestQuote />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Layout;