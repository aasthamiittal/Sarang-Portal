import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState({
    totalShipments: 0,
    totalCost: 0,
    statusCounts: { pending: 0, inTransit: 0, delivered: 0, cancelled: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/reports/shipments-summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    if (token) fetchData();
  }, [token]);

  const statusData = Object.entries(summary.statusCounts).map(([name, value]) => ({
    name: name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    value
  }));

  const MetricCard = ({ title, value, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Shipments" value={summary.totalShipments} color="border-blue-500" />
        <MetricCard title="Total Cost" value={`$${summary.totalCost.toFixed(2)}`} color="border-green-500" />
        <MetricCard title="Pending" value={summary.statusCounts.pending} color="border-yellow-500" />
        <MetricCard title="Delivered" value={summary.statusCounts.delivered} color="border-purple-500" />
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Shipment Status Distribution</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;