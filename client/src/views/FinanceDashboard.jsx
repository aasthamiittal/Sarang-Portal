import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const FinanceDashboard = () => {
  const { token, user } = useAuth();

  // Only allow admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You need administrator privileges to access this page.</p>
      </div>
    );
  }
  const [profitability, setProfitability] = useState({});
  const [sla, setSla] = useState({});
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profitRes, slaRes] = await Promise.all([
        axios.get('http://localhost:5000/api/finance/profitability', { headers }),
        axios.get('http://localhost:5000/api/finance/sla', { headers })
      ]);
      setProfitability(profitRes.data);
      setSla(slaRes.data);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    }
    setLoading(false);
  };

  const profitabilityData = [
    { name: 'Revenue', value: profitability.totalRevenue || 0 },
    { name: 'Cost', value: profitability.totalCost || 0 },
    { name: 'Margin', value: profitability.totalMargin || 0 }
  ];

  const slaData = [
    { name: 'On Time', value: sla.onTimeDeliveries || 0 },
    { name: 'Late', value: (sla.totalShipments || 0) - (sla.onTimeDeliveries || 0) }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Finance Dashboard</h1>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Profitability
              </Typography>
              <BarChart width={400} height={300} data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                SLA Compliance
              </Typography>
              <Typography variant="h6">
                {sla.slaCompliance}% On Time
              </Typography>
              <PieChart width={400} height={300}>
                <Pie
                  data={slaData}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {slaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default FinanceDashboard;