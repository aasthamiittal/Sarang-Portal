import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Shipments from '../pages/Shipments';
import Manifests from '../pages/Manifests';
import Billing from '../pages/Billing';
import Profile from '../pages/Profile';
import Admin from '../pages/Admin';
import RateComparison from '../pages/RateComparison';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/manifests" element={<Manifests />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/rate-comparison" element={<RateComparison />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
};

export default Layout;