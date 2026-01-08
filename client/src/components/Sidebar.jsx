import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Dashboard, LocalShipping, Description, Receipt, Person, AdminPanelSettings, Logout, Inventory, LocalShippingOutlined, Assessment, CloudUpload, SettingsApplications, RequestQuote, AccountBalance } from '@mui/icons-material';
import SarangLogo from '../assets/Logo.png';

const Sidebar = ({ isOpen, setOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLinkClick = () => {
    if (setOpen) setOpen(false);
  };

  const getMenuItems = () => {
    const role = user?.role || 'user';
    const baseItems = [
      { to: '/dashboard', label: 'Dashboard', icon: <Dashboard />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/shipments', label: 'Orders', icon: <LocalShipping />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/multi-box', label: 'Multi Box', icon: <Inventory />, roles: ['admin', 'manager', 'staff'] },
      { to: '/manifests', label: 'Manifests', icon: <Description />, roles: ['admin', 'manager', 'staff'] },
      { to: '/pickup', label: 'Pickup', icon: <LocalShippingOutlined />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/rate-comparison', label: 'Rate Calculator', icon: <Assessment />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/bulk-report', label: 'Bulk Report', icon: <Assessment />, roles: ['admin', 'manager'] },
      { to: '/billing', label: 'Wallet', icon: <Receipt />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/documents', label: 'Documents', icon: <CloudUpload />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/integrations', label: 'Integrations', icon: <SettingsApplications />, roles: ['admin', 'manager'] },
      { to: '/request-quote', label: 'Request Quote', icon: <RequestQuote />, roles: ['admin', 'manager', 'staff', 'user'] },
      { to: '/profile', label: 'Settings', icon: <Person />, roles: ['admin', 'manager', 'staff', 'user'] },
    ];

    // Add KYC for users who need verification
    if (role === 'user' || (user?.kycStatus !== 'approved')) {
      baseItems.splice(-1, 0, { to: '/kyc', label: 'KYC Verification', icon: <Person />, roles: ['user'] });
    }

    // Admin-only items
    if (role === 'admin') {
      baseItems.push(
        { to: '/finance', label: 'Finance', icon: <AccountBalance />, roles: ['admin'] },
        { to: '/admin', label: 'Admin', icon: <AdminPanelSettings />, roles: ['admin'] },
        { to: '/audit-log', label: 'Audit Log', icon: <AdminPanelSettings />, roles: ['admin'] }
      );
    }

    return baseItems.filter(item => item.roles.includes(role));
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${isOpen ? 'block' : 'hidden'} lg:hidden`}
        onClick={() => setOpen(false)}
      ></div>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white p-4 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:transform-none lg:translate-x-0 flex flex-col h-full`}>
          <div className="text-2xl font-bold mb-8 text-center">SARANG</div>
      {/* /  <img src={SarangLogo} alt="Sarang Logo" className="h-16 w-16 mx-auto mb-8" /> */}
        <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {getMenuItems().map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.to ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => { handleLogout(); handleLinkClick(); }}
            className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-gray-700 transition-colors"
          >
            <Logout />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;