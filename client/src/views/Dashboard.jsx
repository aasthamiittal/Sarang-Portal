import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import ExceptionWidgets from '../components/ExceptionWidgets';
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
  Box,
  Bell
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
      case 'LOST':
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      case 'NDR':
      case 'RTO_INITIATED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [trackingHealth, setTrackingHealth] = useState({
    lastSyncTime: null,
    successCount: 0,
    failedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({
    orderSummary: false,
    opsMetrics: false,
    actionsSummary: false,
    walletBalance: false,
    walletActivity: false,
    unreadNotifications: false,
    trackingHealth: false
  });

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, dateFilter]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrors({
      orderSummary: false,
      opsMetrics: false,
      actionsSummary: false,
      walletBalance: false,
      walletActivity: false,
      unreadNotifications: false,
      trackingHealth: false
    });

    const results = await Promise.allSettled([
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
      }),
      axios.get(`${BASE_API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${BASE_API_URL}/tracking/health`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    if (results[0].status === 'fulfilled') {
      setOrderSummary(results[0].value.data);
    } else {
      setOrderSummary({
        allOrders: 0,
        draftedOrders: 0,
        pendingForLabel: 0,
        packedOrders: 0,
        dispatchedOrders: 0,
        awbStockRemaining: 0,
        creditBalance: 0,
        ndrCases: 0,
        exceptionCases: 0
      });
      setErrors(prev => ({ ...prev, orderSummary: true }));
    }

    if (results[1].status === 'fulfilled') {
      setOpsMetrics(results[1].value.data);
    } else {
      setOpsMetrics({
        bookingCount: 0,
        deliveredCount: 0,
        pendingCount: 0,
        recentShipments: []
      });
      setErrors(prev => ({ ...prev, opsMetrics: true }));
    }

    if (results[2].status === 'fulfilled') {
      setActionsSummary(results[2].value.data);
    } else {
      setActionsSummary({
        pickupsInProgress: 0,
        openManifests: 0,
        disputedOrders: 0
      });
      setErrors(prev => ({ ...prev, actionsSummary: true }));
    }

    if (results[3].status === 'fulfilled') {
      setWalletBalance(results[3].value.data.balance);
    } else {
      setWalletBalance(0);
      setErrors(prev => ({ ...prev, walletBalance: true }));
    }

    if (results[4].status === 'fulfilled') {
      setWalletActivity(results[4].value.data);
    } else {
      setWalletActivity([]);
      setErrors(prev => ({ ...prev, walletActivity: true }));
    }

    if (results[5].status === 'fulfilled') {
      setUnreadNotifications(results[5].value.data.count);
    } else {
      setUnreadNotifications(0);
      setErrors(prev => ({ ...prev, unreadNotifications: true }));
    }

    if (results[6].status === 'fulfilled') {
      setTrackingHealth(results[6].value.data);
    } else {
      setTrackingHealth({
        lastSyncTime: null,
        successCount: 0,
        failedCount: 0
      });
      setErrors(prev => ({ ...prev, trackingHealth: true }));
    }

    setIsLoading(false);
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

  const ActionCard = ({ title, value, icon, showProgress = false, onClick }) => (
    <div className={`bg-white p-4 rounded-lg border-l-4 border-blue-500 mb-3 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={onClick}>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>

          {/* Tracking Health Indicator and Notifications Bell */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Tracking Sync Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  trackingHealth.failedCount === 0 &&
                  trackingHealth.lastSyncTime &&
                  (new Date() - new Date(trackingHealth.lastSyncTime)) < 10 * 60 * 1000
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
                title={`Last sync: ${trackingHealth.lastSyncTime ? new Date(trackingHealth.lastSyncTime).toLocaleString() : 'Never'}, Success: ${trackingHealth.successCount}, Failed: ${trackingHealth.failedCount}`}
              ></div>
              <span className="text-sm text-gray-600">Tracking</span>
            </div>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

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
        </div>

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">Loading order summary...</div>
          ) : errors.orderSummary ? (
            <div className="col-span-full text-center py-8 text-red-600">Error loading order summary</div>
          ) : (
            <>
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
                link="/awb"
                icon={Archive}
              />
            </>
          )}
        </div>

        {/* Exception Widgets */}
        {!isLoading && !errors.orderSummary && (
          <ExceptionWidgets
            ndrCases={orderSummary.ndrCases || 0}
            exceptionCases={orderSummary.exceptionCases || 0}
            onNdrClick={() => navigate('/ndr')}
          />
        )}

        {/* Three Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Actions Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Actions</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading actions...</div>
            ) : errors.actionsSummary ? (
              <div className="text-center py-8 text-red-600">Error loading actions</div>
            ) : (
              <div className="space-y-3">
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
                  onClick={() => navigate('/shipments?status=disputed')}
                />
              </div>
            )}
          </div>

          {/* Credit Balance & Wallet Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Credit Balance Header with Blue Background */}
            <div className="bg-blue-100 -mx-6 -mt-6 p-4 sm:p-6 rounded-t-lg mb-6 relative overflow-hidden cursor-pointer hover:bg-blue-200" onClick={() => navigate('/billing')}>
              <div className="relative z-10">
                {isLoading ? (
                  <div>Loading credit balance...</div>
                ) : errors.orderSummary ? (
                  <div className="text-red-600">Error loading credit balance</div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Credit Balance</h2>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${orderSummary.creditBalance?.toFixed(2) || '0.00'}
                    </p>
                  </>
                )}
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
              {isLoading ? (
                <div>Loading activity...</div>
              ) : errors.walletActivity ? (
                <div className="text-red-600">Error loading activity</div>
              ) : (
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
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Shipments</h2>
            {isLoading ? (
              <div className="text-center py-8">Loading shipments...</div>
            ) : errors.opsMetrics ? (
              <div className="text-center py-8 text-red-600">Error loading shipments</div>
            ) : (
              <div className="overflow-x-auto">
                {opsMetrics.recentShipments?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {opsMetrics.recentShipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{shipment.orderId}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"><span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${getStatusColorClass(shipment.status)}`}>{shipment.status}</span></td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{shipment.carrier}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(shipment.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Box className="w-20 h-20 text-gray-300 mb-4" strokeWidth={1} />
                    <p className="text-base font-semibold text-gray-900 mb-1">No Recent Shipments</p>
                    <p className="text-sm text-gray-500">Shipments will appear here after booking.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;