import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, Card, CardContent } from '@mui/material';
import { Payment, Cancel } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'paid': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const columns = [
  { field: 'tracking', headerName: 'Shipment Tracking', width: 180 },
  { field: 'amount', headerName: 'Amount ($)', width: 120, type: 'number' },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        color={getStatusColor(params.value)}
        size="small"
      />
    ),
  },
  { field: 'paidAt', headerName: 'Paid At', width: 180, valueFormatter: (value) => value ? new Date(value).toLocaleString() : 'N/A' },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    renderCell: (params) => (
      <div className="flex space-x-1">
        <Button
          size="small"
          startIcon={<Payment />}
          disabled={params.row.status === 'paid'}
          onClick={() => params.api.handlePay(params.row.id)}
        >
          Mark Paid
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<Cancel />}
          disabled={params.row.status === 'paid'}
          onClick={() => params.api.handleCancel(params.row.id)}
        >
          Cancel
        </Button>
      </div>
    ),
  },
];

const Billing = () => {
  const { token } = useAuth();
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchBillings();
  }, [token]);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/billing', { headers });
      setBillings(response.data);
    } catch (error) {
      console.error('Failed to fetch billings:', error);
    }
    setLoading(false);
  };

  const handlePay = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/billing/${id}`, { status: 'paid', paidAt: new Date() }, { headers });
      fetchBillings();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this billing?')) {
      try {
        await axios.put(`http://localhost:5000/api/billing/${id}`, { action: 'cancel' }, { headers });
        fetchBillings();
      } catch (error) {
        console.error('Failed to cancel billing:', error);
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Billing</h1>
      <Card>
        <CardContent>
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={billings}
              getRowId={(row) => row._id}
              columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
                <div className="flex space-x-1">
                  <Button
                    size="small"
                    startIcon={<Payment />}
                    disabled={params.row.status === 'paid'}
                    onClick={() => handlePay(params.row._id)}
                  >
                    Mark Paid
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Cancel />}
                    disabled={params.row.status === 'paid'}
                    onClick={() => handleCancel(params.row._id)}
                  >
                    Cancel
                  </Button>
                </div>
              )} : col)}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              loading={loading}
              disableSelectionOnClick
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;