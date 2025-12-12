import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { token } = useAuth();
  const [orderSummary, setOrderSummary] = useState({
    allOrders: 0,
    draftedOrders: 0,
    pendingForLabel: 0,
    packedOrders: 0,
    dispatchedOrders: 0
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
      const [orderRes, actionsRes, balanceRes, activityRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/shipments/dashboard-summary?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/shipments/actions-summary?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/wallet/balance', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/wallet/activity?dateFilter=${dateFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOrderSummary(orderRes.data);
      setActionsSummary(actionsRes.data);
      setWalletBalance(balanceRes.data.balance);
      setWalletActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const OrderSummaryCard = ({ title, value, link, color }) => (
    <Link to={link}>
      <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color} hover:shadow-lg transition-shadow cursor-pointer`}>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );

  const ActionCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-3xl ${color.replace('border-', 'text-')}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        {/* Date Filters */}
        <div className="flex space-x-2">
          {['today', 'yesterday', 'last7days', 'last30days', 'custom'].map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <OrderSummaryCard
          title="All Orders"
          value={orderSummary.allOrders}
          link="/shipments"
          color="border-blue-500"
        />
        <OrderSummaryCard
          title="Drafted Orders"
          value={orderSummary.draftedOrders}
          link="/shipments?status=draft"
          color="border-gray-500"
        />
        <OrderSummaryCard
          title="Pending for Label"
          value={orderSummary.pendingForLabel}
          link="/shipments?status=pending-label"
          color="border-yellow-500"
        />
        <OrderSummaryCard
          title="Packed Orders"
          value={orderSummary.packedOrders}
          link="/shipments?status=packed"
          color="border-green-500"
        />
        <OrderSummaryCard
          title="Dispatched Orders"
          value={orderSummary.dispatchedOrders}
          link="/shipments?status=dispatched"
          color="border-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Actions Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Actions</h2>
          <div className="space-y-4">
            <ActionCard
              title="Pickups in Progress"
              value={actionsSummary.pickupsInProgress}
              icon="🚚"
              color="border-blue-500"
            />
            <ActionCard
              title="Open Manifests"
              value={actionsSummary.openManifests}
              icon="📋"
              color="border-green-500"
            />
            <ActionCard
              title="Disputed Orders"
              value={actionsSummary.disputedOrders}
              icon="⚠️"
              color="border-red-500"
            />
          </div>
        </div>

        {/* Wallet Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Wallet</h2>
            <span className="text-2xl font-bold text-green-600">${walletBalance.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
            {walletActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-medium ${activity.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.type === 'credit' ? '+' : '-'}${activity.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for additional content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/shipments" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
              Create New Order
            </Link>
            <Link to="/rate-comparison" className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg text-center hover:bg-green-700 transition-colors">
              Calculate Rates
            </Link>
            <Link to="/pickup" className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-center hover:bg-purple-700 transition-colors">
              Request Pickup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;