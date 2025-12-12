import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

function App() {
  const { authenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={authenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/*" element={authenticated ? <Layout /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;