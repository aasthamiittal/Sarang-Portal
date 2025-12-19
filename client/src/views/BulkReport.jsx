import React, { useState } from 'react';
import { Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Download, PictureAsPdf, TableChart } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const BulkReport = () => {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReport = async () => {
    try {
      const params = { startDate, endDate };
      const response = await axios.get('http://localhost:5000/api/reports/shipments', {
        headers,
        params
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
  };

  const exportReport = async (format) => {
    try {
      const params = { startDate, endDate, format };
      const response = await axios.get('http://localhost:5000/api/reports/shipments/export', {
        headers,
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipment-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in-transit': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Bulk Report</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button variant="contained" onClick={fetchReport} fullWidth>
            Generate Report
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={() => exportReport('csv')}
            disabled={!reportData.length}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => exportReport('pdf')}
            disabled={!reportData.length}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {reportData.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Tracking Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Carrier</TableCell>
                <TableCell>Weight (kg)</TableCell>
                <TableCell>Cost ($)</TableCell>
                <TableCell>Pickup Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Delivery Time (days)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.orderId}</TableCell>
                  <TableCell>{row.trackingNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status.replace('-', ' ').toUpperCase()}
                      color={getStatusColor(row.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.carrier}</TableCell>
                  <TableCell>{row.weight}</TableCell>
                  <TableCell>{row.cost}</TableCell>
                  <TableCell>{row.pickupDate ? new Date(row.pickupDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{row.deliveryTime || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default BulkReport;