import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Shipments from '../pages/Shipments';
import MultiBox from '../pages/MultiBox';
import Manifests from '../pages/Manifests';
import Pickup from '../pages/Pickup';
import RateComparison from '../pages/RateComparison';
import BulkReport from '../pages/BulkReport';
import Billing from '../pages/Billing';
import Documents from '../pages/Documents';
import Integrations from '../pages/Integrations';
import RequestQuote from '../pages/RequestQuote';
import Profile from '../pages/Profile';
import Admin from '../pages/Admin';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/multi-box" element={<MultiBox />} />
          <Route path="/manifests" element={<Manifests />} />
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
  );
};

export default Layout;