import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './views/Login';
import Layout from './components/Layout';
import PublicTracking from './views/PublicTracking'; // Import the new public tracking component

function App() {
  const { authenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={authenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/track" element={<PublicTracking />} /> {/* Public tracking route */}
      <Route path="/*" element={authenticated ? <Layout /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;