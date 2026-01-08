import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, Grid
} from '@mui/material';
import { Reply, Transform } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const AdminQuotes = () => {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondDialog, setRespondDialog] = useState({ open: false, quote: null });
  const [responseData, setResponseData] = useState({ quotedPrice: '', adminResponse: '', expiresAt: '' });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/quotes`, { headers });
      setQuotes(response.data);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (quote) => {
    setRespondDialog({ open: true, quote });
    setResponseData({
      quotedPrice: quote.quotedPrice || '',
      adminResponse: quote.adminResponse || '',
      expiresAt: quote.expiresAt ? new Date(quote.expiresAt).toISOString().slice(0, 16) : ''
    });
  };

  const handleRespondSubmit = async () => {
    try {
      await axios.put(`${BASE_API_URL}/quotes/${respondDialog.quote._id}`, responseData, { headers });
      setRespondDialog({ open: false, quote: null });
      fetchQuotes();
      alert('Quote responded successfully.');
    } catch (error) {
      console.error('Failed to respond to quote:', error);
      alert('Failed to respond to quote.');
    }
  };

  const handleConvert = async (quoteId) => {
    try {
      await axios.post(`${BASE_API_URL}/quotes/${quoteId}/convert`, {}, { headers });
      fetchQuotes();
      alert('Quote converted to shipment successfully.');
    } catch (error) {
      console.error('Failed to convert quote:', error);
      alert('Failed to convert quote.');
    }
  };

  const columns = [
    { field: '_id', headerName: 'ID', width: 100, valueGetter: (params) => params.row._id.slice(-6) },
    { field: 'origin', headerName: 'Origin', width: 120 },
    { field: 'destination', headerName: 'Destination', width: 120 },
    { field: 'weight', headerName: 'Weight (kg)', width: 100 },
    { field: 'serviceType', headerName: 'Service', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'ACCEPTED' ? 'success' :
            params.value === 'REJECTED' ? 'error' :
            params.value === 'RESPONDED' ? 'warning' :
            'default'
          }
          size="small"
        />
      )
    },
    { field: 'quotedPrice', headerName: 'Quoted Price', width: 120, valueGetter: (params) => params.row.quotedPrice ? `₹${params.row.quotedPrice}` : '-' },
    { field: 'createdAt', headerName: 'Created', width: 150, valueGetter: (params) => new Date(params.row.createdAt).toLocaleDateString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.row.status === 'PENDING' && (
            <Tooltip title="Respond">
              <IconButton onClick={() => handleRespond(params.row)} color="primary">
                <Reply />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'ACCEPTED' && (
            <Tooltip title="Convert to Shipment">
              <IconButton onClick={() => handleConvert(params.row._id)} color="secondary">
                <Transform />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        Quote Management
      </Typography>

      <Card>
        <CardContent>
          <DataGrid
            rows={quotes}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            loading={loading}
            getRowId={(row) => row._id}
            autoHeight
          />
        </CardContent>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={respondDialog.open} onClose={() => setRespondDialog({ open: false, quote: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Quote</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Quoted Price"
                type="number"
                fullWidth
                value={responseData.quotedPrice}
                onChange={(e) => setResponseData({ ...responseData, quotedPrice: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Admin Response"
                multiline
                rows={4}
                fullWidth
                value={responseData.adminResponse}
                onChange={(e) => setResponseData({ ...responseData, adminResponse: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Expires At"
                type="datetime-local"
                fullWidth
                value={responseData.expiresAt}
                onChange={(e) => setResponseData({ ...responseData, expiresAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondDialog({ open: false, quote: null })}>Cancel</Button>
          <Button onClick={handleRespondSubmit} variant="contained">Submit Response</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuotes;