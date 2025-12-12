import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Dashboard, LocalShipping, Description, Receipt, Person, AdminPanelSettings, Logout } from '@mui/icons-material';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { to: '/shipments', label: 'Shipments', icon: <LocalShipping /> },
    { to: '/manifests', label: 'Manifests', icon: <Description /> },
    { to: '/billing', label: 'Billing', icon: <Receipt /> },
    { to: '/profile', label: 'Profile', icon: <Person /> },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: <AdminPanelSettings /> }] : []),
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="text-2xl font-bold mb-8 text-center">SARANG</div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              location.pathname === item.to ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-gray-700 transition-colors"
        >
          <Logout />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;