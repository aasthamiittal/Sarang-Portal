import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Edit,
  FileText,
  Package,
  Send,
  Archive,
  Truck,
  FileCheck,
  AlertTriangle,
  Box
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { token } = useAuth();
  const [orderSummary, setOrderSummary] = useState({
    allOrders: 0,
    draftedOrders: 0,
    pendingForLabel: 0,
    packedOrders: 0,
    dispatchedOrders: 0,
    awbStockRemaining: 0,
    creditBalance: 0
  });
  const [opsMetrics, setOpsMetrics] = useState({
    bookingCount: 0,
    deliveredCount: 0,
    pendingCount: 0,
    recentShipments: []
  });
  const [actionsSummary, setActionsSummary] = useState({
    pickupsInProgress: 0,
    openManifests: 0,
    disputedOrders: 0
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActivity, setWalletActivity] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, dateFilter]);

  const fetchDashboardData = async () => {
    try {
      const [orderRes, opsRes, actionsRes, balanceRes, activityRes] = await Promise.all([
        axios.get(`${BASE_API_URL}/shipments/dashboard-summary?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_API_URL}/shipments/ops-metrics?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_API_URL}/shipments/actions-summary?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_API_URL}/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_API_URL}/wallet/activity?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOrderSummary(orderRes.data);
      setOpsMetrics(opsRes.data);
      setActionsSummary(actionsRes.data);
      setWalletBalance(balanceRes.data.balance);
      setWalletActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const OrderSummaryCard = ({ title, value, link, icon: Icon }) => (
    <Link to={link}>
      <div className="bg-blue-100 p-5 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-medium text-gray-800 leading-tight">{title}</h3>
          <Icon className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
        </div>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );

  const ActionCard = ({ title, value, icon, showProgress = false }) => (
    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-800 mb-1">{title}</h3>
          <div className="flex items-center gap-3">
           <p className="text-2xl font-bold text-gray-900">{value}</p>
           {showProgress && (
             <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px] sm:max-w-[120px] md:max-w-[150px]">
               <div className="h-2 bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
             </div>
           )}
         </div>
        </div>
        <div className="text-4xl ml-3">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          
          {/* Date Filters */}
          <div className="flex flex-wrap gap-2">
            {['today', 'yesterday', 'last7days', 'last30days', 'custom'].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter === 'last7days' ? 'Last 7 days' :
                 filter === 'last30days' ? 'Last 30 days' :
                 filter === 'custom' ? 'Custom range' :
                 filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <OrderSummaryCard
            title="All Orders"
            value={orderSummary.allOrders}
            link="/shipments"
            icon={ShoppingCart}
          />
          <OrderSummaryCard
            title="Drafted Orders"
            value={orderSummary.draftedOrders}
            link="/shipments?status=draft"
            icon={Edit}
          />
          <OrderSummaryCard
            title="Pending for Label"
            value={orderSummary.pendingForLabel}
            link="/shipments?status=pending-label"
            icon={FileText}
          />
          <OrderSummaryCard
            title="Packed Orders"
            value={orderSummary.packedOrders}
            link="/shipments?status=packed"
            icon={Package}
          />
          <OrderSummaryCard
            title="Dispatched Orders"
            value={orderSummary.dispatchedOrders}
            link="/shipments?status=dispatched"
            icon={Send}
          />
          <OrderSummaryCard
            title="AWB Stock Remaining"
            value={orderSummary.awbStockRemaining}
            link="/awb-stock"
            icon={Archive}
          />
        </div>

        {/* Three Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Actions</h2>
            <div>
              <ActionCard
                title="Pickups in Progress"
                value={actionsSummary.pickupsInProgress}
                icon="🚚"
                showProgress={true}
              />
              <ActionCard
                title="Open Manifests"
                value={actionsSummary.openManifests}
                icon="📋"
              />
              <ActionCard
                title="Disputed Orders"
                value={actionsSummary.disputedOrders}
                icon="⚠️"
              />
            </div>
          </div>

          {/* Credit Balance & Wallet Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Credit Balance Header with Blue Background */}
            <div className="bg-blue-100 -mx-6 -mt-6 p-4 sm:p-6 rounded-t-lg mb-6 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Credit Balance</h2>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                  ${orderSummary.creditBalance?.toFixed(2) || '0.00'}
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-blue-200 rounded-full opacity-30"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200 rounded-tl-full opacity-20"></div>
              <svg className="absolute top-4 right-6 sm:top-6 sm:right-8 w-6 h-6 sm:w-8 sm:h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-1">
                {walletActivity.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{activity.description}</p>
                    </div>
                    <span className={`text-sm font-semibold ml-4 ${activity.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.type === 'credit' ? '+' : '-'}${activity.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Shipments */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Shipments</h2>
            <div className="space-y-2">
              {opsMetrics.recentShipments?.length > 0 ? (
                opsMetrics.recentShipments.map((shipment) => (
                  <div key={shipment.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{shipment.orderId}</p>
                      <p className="text-xs text-gray-400">{shipment.carrier} • {shipment.status}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Box className="w-20 h-20 text-gray-300 mb-4" strokeWidth={1} />
                  <p className="text-base font-semibold text-gray-900 mb-1">Recent Shipments</p>
                  <p className="text-sm text-gray-500">No recent shipments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;